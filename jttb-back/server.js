const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración desde variables de entorno (obligatorias)
const JWT_SECRET = process.env.JTTB_JWT_SECRET;
const JTTB_USER = process.env.JTTB_USER;
const JTTB_PASSWORD = process.env.JTTB_PASSWORD;
const TOKEN_EXPIRY = process.env.JTTB_TOKEN_EXPIRY || '8h';
const EXEC_TIMEOUT = parseInt(process.env.JTTB_EXEC_TIMEOUT) || 30000; // 30 segundos por defecto
const JTTB_SHELL = process.env.JTTB_SHELL || 'auto'; // auto, cmd, powershell, sh

// Validar que las variables estén seteadas
if (!JWT_SECRET || !JTTB_USER || !JTTB_PASSWORD) {
  console.error('ERROR: Variables de entorno requeridas:');
  console.error('  - JTTB_JWT_SECRET');
  console.error('  - JTTB_USER');
  console.error('  - JTTB_PASSWORD');
  process.exit(1);
}

// Usuario desde variables de entorno
const USERS = {
  [JTTB_USER]: {
    username: JTTB_USER,
    passwordHash: bcrypt.hashSync(JTTB_PASSWORD, 10)
  }
};

// CORS totalmente abierto (sin SSL)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: '*',
  credentials: false
}));
app.options('*', cors());
app.use(express.json());

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Health check (público)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username y password requeridos' });
  }

  const user = USERS[username];

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = jwt.sign(
    { username: user.username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  res.json({
    token,
    username: user.username,
    expiresIn: TOKEN_EXPIRY
  });
});

// Verificar token
app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Directorio inicial
const DEFAULT_CWD = process.env.JTTB_DEFAULT_CWD || os.homedir();

// Descargar archivo (protegido)
app.get('/api/download', authMiddleware, (req, res) => {
  const filePath = req.query.path;
  const cwd = req.query.cwd || DEFAULT_CWD;

  if (!filePath) {
    return res.status(400).json({ error: 'Path requerido' });
  }

  // Resolver path absoluto
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);

  console.log(`[${new Date().toISOString()}] User: ${req.user.username} | Download: ${absolutePath}`);

  // Verificar que el archivo existe
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: 'Archivo no encontrado' });
  }

  // Verificar que es un archivo (no directorio)
  const stats = fs.statSync(absolutePath);
  if (stats.isDirectory()) {
    return res.status(400).json({ error: 'No se puede descargar un directorio' });
  }

  // Enviar archivo
  const fileName = path.basename(absolutePath);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', 'application/octet-stream');

  const fileStream = fs.createReadStream(absolutePath);
  fileStream.pipe(res);
});

// Configurar multer para upload
const upload = multer({ storage: multer.memoryStorage() });

// Subir archivo (protegido)
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  const cwd = req.body.cwd || DEFAULT_CWD;

  if (!req.file) {
    return res.status(400).json({ error: 'Archivo requerido' });
  }

  const fileName = req.file.originalname;
  const destPath = path.join(cwd, fileName);

  console.log(`[${new Date().toISOString()}] User: ${req.user.username} | Upload: ${destPath}`);

  // Verificar que el directorio destino existe
  if (!fs.existsSync(cwd)) {
    return res.status(400).json({ error: 'Directorio destino no existe' });
  }

  // Guardar archivo
  try {
    fs.writeFileSync(destPath, req.file.buffer);
    res.json({
      success: true,
      message: `Archivo subido: ${fileName}`,
      path: destPath,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: `Error al guardar: ${error.message}` });
  }
});

// Ejecutar comando (protegido)
app.post('/api/exec', authMiddleware, (req, res) => {
  const { command, cwd } = req.body;
  let currentCwd = cwd || DEFAULT_CWD;

  if (!command) {
    return res.status(400).json({ error: 'Comando requerido' });
  }

  // Log del comando ejecutado
  console.log(`[${new Date().toISOString()}] User: ${req.user.username} | CWD: ${currentCwd} | Command: ${command}`);

  // Detectar cambio de disco en Windows (ej: D:, C:)
  const driveMatch = command.match(/^([a-zA-Z]):$/);
  if (driveMatch) {
    const drive = driveMatch[1].toUpperCase() + ':\\';
    exec(`cd`, { cwd: drive, timeout: 5000 }, (error, stdout) => {
      if (error) {
        res.json({
          success: false,
          stdout: '',
          stderr: `No se puede acceder a: ${drive}`,
          error: error.message,
          cwd: currentCwd
        });
      } else {
        res.json({
          success: true,
          stdout: '',
          stderr: '',
          error: null,
          cwd: drive
        });
      }
    });
    return;
  }

  // Detectar comando cd
  const cdMatch = command.match(/^cd\s+(.+)$/i);
  if (cdMatch) {
    let newDir = cdMatch[1].trim().replace(/^["']|["']$/g, ''); // Quitar comillas

    // Resolver path relativo o absoluto
    if (!path.isAbsolute(newDir)) {
      newDir = path.resolve(currentCwd, newDir);
    }

    // Verificar que el directorio existe
    exec(`cd "${newDir}" && cd`, { cwd: currentCwd, timeout: 5000 }, (error, stdout) => {
      if (error) {
        res.json({
          success: false,
          stdout: '',
          stderr: `No se puede acceder a: ${newDir}`,
          error: error.message,
          cwd: currentCwd
        });
      } else {
        const resolvedDir = stdout.trim() || newDir;
        res.json({
          success: true,
          stdout: '',
          stderr: '',
          error: null,
          cwd: resolvedDir
        });
      }
    });
    return;
  }

  // Ejecutar comando normal en el cwd actual
  const isWindows = os.platform() === 'win32';

  // Determinar shell y comando según configuración
  let shell, finalCommand;
  if (JTTB_SHELL === 'powershell' || (JTTB_SHELL === 'auto' && isWindows)) {
    shell = 'powershell.exe';
    finalCommand = `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${command}`;
  } else if (JTTB_SHELL === 'cmd') {
    shell = 'cmd.exe';
    finalCommand = `chcp 65001 >nul && ${command}`;
  } else {
    shell = '/bin/sh';
    finalCommand = command;
  }

  const execOptions = {
    cwd: currentCwd,
    timeout: EXEC_TIMEOUT,
    maxBuffer: 1024 * 1024,
    encoding: 'utf8',
    shell: shell
  };
  exec(finalCommand, execOptions, (error, stdout, stderr) => {
    res.json({
      success: !error,
      stdout: stdout || '',
      stderr: stderr || '',
      error: error ? error.message : null,
      cwd: currentCwd
    });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`JTTB Backend running on port ${PORT}`);
  console.log(`User configured: ${JTTB_USER}`);
  console.log(`Token expiry: ${TOKEN_EXPIRY}`);
  console.log(`Exec timeout: ${EXEC_TIMEOUT}ms`);
  console.log(`Shell: ${JTTB_SHELL}`);
});
