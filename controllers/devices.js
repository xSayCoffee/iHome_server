import Channels from '../models/Channels.js';
import Devices from '../models/Devices.js';
import Nodes from '../models/Nodes.js';
import Rooms from '../models/Rooms.js';
import { mqttSendMess } from './nodes.js';

export const addDevices = async (req, res) => {
    try {
        const { name, home, room } = req.body.body;

        const newDevice = new Devices({
            name: name,
            home: home,
            room: room,
            relay: {},
        });

        const device = await newDevice.save();
        res.status(201).json('add device successfull!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAllDevices = async (req, res) => {
    try {
        const { id } = req.params;
        const devices = await Devices.find({ home: id });

        const promises = await devices.map(async (device) => {
            const relay = new Promise(async (resolve, reject) => {
                resolve(await Channels.findById(device?.relay));
            });
            return relay;
        });

        const relays = await Promise.all(promises);

        res.status(200).json({ devices: devices, relays: relays });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const getDevicesByRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const devices = await Devices.find({ room: id });

        const promises = await devices.map(async (device) => {
            const relay = new Promise(async (resolve, reject) => {
                resolve(await Channels.findById(device?.relay));
            });
            return relay;
        });

        const relays = await Promise.all(promises);

        res.status(200).json({ devices: devices, relays: relays });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const getDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await Devices.findById(id);
        const room = await Rooms.findById(device?.room);
        device.room = room;

        if (device?.relay) {
            const channel = await Channels.findOne({ _id: device.relay });
            const relay = await Nodes.findOne({ address: channel.address });

            const promises = await channel.linkWithNode.map(async (node) => {
                const button = new Promise(async (resolve, reject) => {
                    resolve(await Nodes.findById(node._id));
                });
                return button;
            });

            const buttons = await Promise.all(promises);
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].numChannel = channel.linkWithNode[i].channel;
            }

            device.relay = {
                _id: channel._id,
                channel: channel?.channel,
                buttons: buttons,
                isActive: channel?.isActive,
                name: relay.name,
                address: relay.address,
                state: channel?.state,
            };
        }

        res.status(200).json(device);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const device = await Devices.findById({ _id: id });

        if (device?.relay) {
            await Channels.findOneAndUpdate(
                { _id: device.relay },
                { typeLink: '', link: '' },
                { new: true },
            );
        }

        await Devices.findByIdAndDelete({ _id: id });

        res.status(200).json({ message: 'Delete Success!' });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const linkDevices = async (req, res) => {
    try {
        const { device, relay } = req.body.body;

        await Devices.findOneAndUpdate({ _id: device }, { relay: relay }, { new: true });

        await Channels.findOneAndUpdate(
            { _id: relay },
            { link: device, typeLink: 'Devices' },
            { new: true },
        );

        res.status(201).json('Link success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateDevice = async (req, res) => {
    try {
        const { mqttPath, relay } = req.body.body;

        const relayControl = await Nodes.findOne({ address: relay.address });

        let controlRelay;
        // if (relayControl?.isADE === true) {
        //   controlRelay = {
        //     action: "control",
        //     dev_addr: relay.address,
        //     channel: relay.channel,
        //   };
        // } else {
        controlRelay = {
            dev_addr: relay.address,
            channel: relay.channel,
        };
        // }

        mqttSendMess(mqttPath + '/control', controlRelay);

        await Channels.findOneAndUpdate({ _id: relay._id }, { state: !relay.state });

        res.status(200).json('Change status success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const disconnectRelay = async (req, res) => {
    try {
        const { relayChannel, device } = req.body.body;

        await Devices.findOneAndUpdate({ _id: device }, { relay: null }, { new: true });

        await Channels.findOneAndUpdate(
            { _id: relayChannel },
            { typeLink: '', link: '' },
            { new: true },
        );

        res.status(201).json('Change status success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const linkButton = async (req, res) => {
    try {
        const { relay, button, mqttPath } = req.body.body;
        const channel = await Channels.findById(relay._id);
        const node = await Nodes.findById(button._id);

        const linkButtonRelay = {
            action: 'command',
            command: 'link_dev',
            btn_addr: node.address,
            btn_channel: button.channel,
            relay_addr: channel.address,
            relay_channel: channel.channel,
        };

        mqttSendMess(mqttPath, linkButtonRelay);

        let linkWithNode = [];
        if (channel?.linkWithNode) {
            linkWithNode = channel?.linkWithNode;
        }

        linkWithNode.push(button);
        await Channels.findOneAndUpdate(
            { _id: relay._id },
            { linkWithNode: linkWithNode },
            { new: true },
        );

        const channels = node?.channels;
        channels[button.channel - 1].push(relay);
        await Nodes.findOneAndUpdate({ _id: button._id }, { channels: channels }, { new: true });

        res.status(201).json('connect success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const disconnectButton = async (req, res) => {
    try {
        const { relay, button, mqttPath } = req.body.body;

        const channel = await Channels.findById(relay._id);
        const node = await Nodes.findById(button._id);

        const disconnectButtonRelay = {
            action: 'command',
            command: 'disconnect_dev',
            btn_addr: node.address,
            btn_channel: button.channel,
            relay_addr: channel.address,
            relay_channel: channel.channel,
        };

        mqttSendMess(mqttPath, disconnectButtonRelay);

        const buttonFilter = (buttonNode) => {
            return buttonNode._id !== button._id || buttonNode.channel !== button.channel;
        };

        const linkWithNode = channel?.linkWithNode.filter(buttonFilter);

        await Channels.findOneAndUpdate(
            { _id: relay._id },
            { linkWithNode: linkWithNode },
            { new: true },
        );

        const relayFilter = (relayNode) => {
            return relayNode._id !== relay._id || relayNode.channel !== relay.channel;
        };

        const channels = node?.channels;

        channels[button.channel - 1] = channels[button.channel - 1].filter(relayFilter);

        await Nodes.findOneAndUpdate({ _id: button._id }, { channels: channels }, { new: true });

        res.status(201).json('connect success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const editDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, room } = req.body.body;

        const device = await Devices.findOneAndUpdate(
            { _id: id },
            { name: name, room: room },
            { new: true },
        );

        res.status(201).json('Change status success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
