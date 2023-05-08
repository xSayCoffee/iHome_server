import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { register } from './controllers/auth.js';
import adesRoutes from './routes/ades.js';
import authRoutes from './routes/auth.js';
import devicesRoutes from './routes/devices.js';
import homesRoutes from './routes/homes.js';
import membersRoutes from './routes/members.js';
import nodesRoutes from './routes/nodes.js';
import roomsRoutes from './routes/rooms.js';
import userRoutes from './routes/users.js';
import socketService from './services/socket.service.js';

import './controllers/nodes.js';

const directStorage = 'public/assets';
const corsOptions = {
    origin: [
        'http://localhost:3001',
        'http://localhost:3000',
        'https://storage.googleapis.com/deathshop-15e27.appspot.com',
    ],
    credentials: true,
    optionSuccessStatus: 200,
};

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('common'));
app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));
app.use(cors());
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use(cors(corsOptions));

/* FILE STORAGE */

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, directStorage);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });

/* ROUTES WITH FILES */
app.post('/auth/register', upload.single('picture'), register);
app.post('/homes/add/:id', upload.single('picture'), register);

/* ROUTES */
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/nodes', nodesRoutes);
app.use('/homes', homesRoutes);
app.use('/rooms', roomsRoutes);
app.use('/devices', devicesRoutes);
app.use('/ades', adesRoutes);
app.use('/members', membersRoutes);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 6001;

const server = app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000', 
        methods: ['GET', 'POST'],
    },
});

global._io = io;

global._io.on('connection', socketService.connection);

mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Connect mongodb success');
    })
    .catch((error) => console.log(`${error} did not connect`));
