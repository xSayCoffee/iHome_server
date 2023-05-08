import Channels from '../models/Channels.js';
import Nodes from '../models/Nodes.js';
import Rooms from '../models/Rooms.js';
import { mqttSendMess } from './nodes.js';

export const addRooms = async (req, res) => {
    try {
        const { name, home } = req.body.body;

        const newRoom = new Rooms({
            name: name,
            home: home,
            sensor: null,
            relay: null,
        });

        const savedRoom = await newRoom.save();

        res.status(201).json(savedRoom);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAllRooms = async (req, res) => {
    try {
        const { id } = req.params;
        const rooms = await Rooms.find({ home: id });

        const promises = await rooms.map(async (room) => {
            const relay = new Promise((resolve, reject) => {
                resolve(Channels.findById(room.relay));
            });

            return relay;
        });

        const relays = await Promise.all(promises);

        res.status(200).json({ rooms, relays });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const getRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const rooms = await Rooms.findById(id);
        res.status(200).json(rooms);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;

        const room = await Rooms.findById({ _id: id });

        await Channels.findOneAndUpdate(
            { address: room?.relay?.address, channel: room?.relay?.channel },
            { linkWithDevice: '', link: '' },
            { new: true },
        );

        await Rooms.findByIdAndDelete({ _id: id });
        res.status(200).json({ message: 'Delete Success!' });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const linkRoomRelay = async (req, res) => {
    try {
        const { room, relay } = req.body.body;

        await Rooms.findByIdAndUpdate(room, { relay: relay }, { new: true });

        await Channels.findByIdAndUpdate(relay, { link: room, typeLink: 'Rooms' }, { new: true });

        res.status(201).json('Link success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const unlinkRoomRelay = async (req, res) => {
    try {
        const { room, relay } = req.body.body;

        await Rooms.findByIdAndUpdate(room, { relay: '' }, { new: true });

        await Channels.findByIdAndUpdate(relay, { link: '', typeLink: '' }, { new: true });

        res.status(201).json('Unlink success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const linkRoomSensor = async (req, res) => {
    try {
        const { room, sensor } = req.body.body;

        await Rooms.findByIdAndUpdate(room, { sensor: sensor }, { new: true });

        await Nodes.findByIdAndUpdate(sensor, { link: room, typeLink: 'Rooms' }, { new: true });

        res.status(201).json('Link success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const unlinkRoomSensor = async (req, res) => {
    try {
        const { room, sensor } = req.body.body;

        await Rooms.findByIdAndUpdate(room, { sensor: '' }, { new: true });

        await Nodes.findByIdAndUpdate(sensor, { link: '', typeLink: '' }, { new: true });

        res.status(201).json('Unlink success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateRoom = async (req, res) => {
    try {
        const { id, state, mqttPath, relay } = req.body.body;

        const controlRelay = {
            action: 'control',
            dev_addr: relay.address,
            channel: relay.channel,
            status1: relay.channel === 1 ? (state ? 'ON' : 'OFF') : 'NONE',
            status2: relay.channel === 2 ? (state ? 'ON' : 'OFF') : 'NONE',
            status3: relay.channel === 3 ? (state ? 'ON' : 'OFF') : 'NONE',
        };

        mqttSendMess(mqttPath, controlRelay);

        await Rooms.findOneAndUpdate({ _id: id }, { state: state }, { new: true });

        res.status(201).json('Change state success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
