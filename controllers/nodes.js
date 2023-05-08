import { permitJoin } from '../const/index.js';

import dotenv from 'dotenv';
import mqtt from 'mqtt';
import Ades from '../models/Ades.js';
import Channels from '../models/Channels.js';
import Devices from '../models/Devices.js';
import Homes from '../models/Homes.js';
import Nodes from '../models/Nodes.js';
import Rooms from '../models/Rooms.js';
import Sensors from '../models/Sensors.js';
dotenv.config();

const relayType = 'Relay';
const buttonType = 'Button';
const sensorType = 'Sensor';

export let changeState = false;

export const setChangeState = (state) => {
    changeState = state;
};

let node;

// let caFile = fs.readFileSync(
//   "D:\\LuanVan\\iHome\\server\\public\\files\\mosquitto.org.crt"
// );
// let certFile = fs.readFileSync(
//   "D:\\LuanVan\\iHome\\server\\public\\files\\client.crt"
// );
// let keyFile = fs.readFileSync(
//   "D:\\LuanVan\\iHome\\server\\public\\files\\client.key"
// );

// let opts = {
//   rejectUnauthorized: false,
//   cert: certFile,
//   key: keyFile,
//   connectTimeout: 5000,
// };

const client = mqtt.connect(process.env.BROKER_URL);

client.on('error', (error) => console.log('error', error.message));

client.on('connect', () => {
    client.subscribe(process.env.MQTT_SUBCRIBERS, function (err) {
        if (!err) {
            console.log('Client has subcribed successfully!');
        } else {
            console.log(err);
        }
    });
});

const updateRelay = async (relayNode, message) => {
    const channels1 = await Channels.findByIdAndUpdate(relayNode.channels[0], {
        state: message.status1 === 'ON' ? true : false,
    });
    const channels2 = await Channels.findByIdAndUpdate(relayNode.channels[1], {
        state: message.status2 === 'ON' ? true : false,
    });
    const channels3 = await Channels.findByIdAndUpdate(relayNode.channels[2], {
        state: message.status3 === 'ON' ? true : false,
    });
    changeState = true;

    _io.emit(`changetele/${channels1._id}`, channels1);
    _io.emit(`changetele/${channels2._id}`, channels2);
    _io.emit(`changetele/${channels3._id}`, channels3);
};

const updateADE = async (relayNode, message) => {
    // console.log(message);
    const channel = await Channels.findById(relayNode.channels[0]);

    if (
        (channel?.state && message?.status === 'OFF') ||
        (channel?.state === false && message?.status === 'ON')
    ) {
        changeState = true;
        const channel = await Channels.findByIdAndUpdate(
            { _id: relayNode.channels[0] },
            { state: message?.status === 'ON' ? true : false, isActive: true },
        );

        _io.emit(`changetele/${channel._id}`, channel);
    }

    if (message.vrms < 300 && message.irms < 20 && message.power < 1000) {
        const newADE = new Ades({
            address: message.dev_addr,
            irms: message.irms,
            vrms: message.vrms,
            power: message.power,
        });

        const adeUpdate = await newADE.save();
        _io.emit(`changeAde/${adeUpdate.address}`, adeUpdate);
    }
};

const updateSensor = async (relayNode, message) => {
    const update = await Sensors.findOneAndUpdate(
        { address: message.dev_addr },
        {
            temp: message.temp,
            humidity: message.humidity,
            airquality: message.airquality,
            isActive: true,
        },
    );
    _io.emit(`changeSensor/${update.address}`, update);
};

const mqttHandle = async (topic, payload) => {
    try {
        const message = JSON.parse(payload.toString());

        if (topic.includes('mybk/up/provision')) {
            node = message;
        } else if (topic.includes('mybk/up/telemetry')) {
            const nodeTemp = await Nodes.findOne({ address: message?.dev_addr });
            if (nodeTemp?.type === relayType) {
                if (nodeTemp?.isADE === true) {
                    updateADE(nodeTemp, message);
                } else {
                    updateRelay(nodeTemp, message);
                }
            } else if (nodeTemp?.type === sensorType) {
                updateSensor(nodeTemp, message);
            }
        } else if (topic.includes('mybk/up/status')) {
            if (message?.status === 'offline') {
                await Homes.findOneAndUpdate({ mqttPath: message?.home }, { isActive: false });
            } else {
                await Homes.findOneAndUpdate({ mqttPath: message?.home }, { isActive: true });
            }
        } else if (topic.includes('mybk/up/device_status')) {
            if (message?.status === 'offline') {
                await Nodes.findOneAndUpdate({ address: message?.dev_addr }, { isActive: false });
            } else {
                await Nodes.findOneAndUpdate({ address: message?.dev_addr }, { isActive: true });
            }
        }
    } catch (err) {
        console.log(err);
    }
};

client.on('message', mqttHandle);

export const mqttSendMess = (topic, data) => {
    try {
        const dataConvert = JSON.stringify(data);
        client.publish(topic, dataConvert);
    } catch (err) {
        console.log(err);
    }
};

export const addNodes = async (req, res) => {
    try {
        const { id } = req.params;
        const { topic, room } = req.body;
        mqttSendMess(topic, permitJoin);

        const timer = setTimeout(() => {
            clearInterval(timeInterval);
            res.status(200).json(undefined);
        }, 20000);

        const timeInterval = setInterval(async () => {
            if (node) {
                clearInterval(timeInterval);
                clearTimeout(timer);
                await Nodes.deleteMany({ address: node?.dev_addr });
                await Channels.deleteMany({ address: node?.dev_addr });

                if (node?.type === relayType) {
                    const channels = [];

                    for (let i = 0; i < node?.numChannel; i++) {
                        const newChannel = new Channels({
                            address: node?.dev_addr,
                            channel: i + 1,
                            isActive: true,
                            link: '',
                            typeLink: '',
                            linkWithNode: [],
                            state: false,
                        });
                        const channel = await newChannel.save();
                        channels[i] = channel._id;
                    }

                    const newNode = new Nodes({
                        name: 'New Relay',
                        home: id,
                        room: room ? room : '',
                        address: node?.dev_addr,
                        type: node?.type,
                        numChannel: node?.numChannel,
                        isADE: node?.isADE,
                        channels: channels,
                        isActive: true,
                    });

                    node = await newNode.save();
                } else if (node?.type === 'Button') {
                    const newNode = new Nodes({
                        name: 'New Button',
                        home: id,
                        room: room ? room : '',
                        address: node?.dev_addr,
                        type: node?.type,
                        numChannel: node?.numChannel,
                        channels: [[], [], []],
                        isActive: true,
                    });
                    node = await newNode.save();
                } else if (node?.type === 'Sensor') {
                    const newSensor = new Sensors({
                        address: node?.dev_addr,
                    });

                    const sensor = await newSensor.save();

                    const newNode = new Nodes({
                        name: 'New Sensor',
                        home: id,
                        room: room ? room : '',
                        address: node?.dev_addr,
                        sensor: sensor,
                        type: node?.type,
                        isActive: true,
                    });
                    node = await newNode.save();
                }
                node = undefined;
                res.status(200).json('Add node success!');
            }
        }, 1010);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAllNodes = async (req, res) => {
    try {
        const { id } = req.params;
        let allNodes = await Nodes.find({ home: id });

        const promises = await allNodes.map(async (node) => {
            if (node?.channels) {
                const promises2 = await node.channels.map(async (channelId) => {
                    const channel = new Promise((resolve, reject) => {
                        resolve(Channels.findById(channelId));
                    });
                    return channel;
                });

                const channels = await Promise.all(promises2);
                node.channels = channels;
                return node;
            }

            return node;
        });

        allNodes = await Promise.all(promises);
        res.status(200).json(allNodes);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const getAllNodesRelay = async (req, res) => {
    try {
        const { id } = req.params;
        let allNodes = await Nodes.find({ home: id, type: relayType });

        const promises = await allNodes.map(async (node) => {
            if (node?.channels) {
                const promises2 = await node.channels.map(async (channelId) => {
                    const channel = new Promise((resolve, reject) => {
                        resolve(Channels.findById(channelId));
                    });
                    return channel;
                });

                const channels = await Promise.all(promises2);
                node.channels = channels;
                return node;
            }

            return node;
        });

        allNodes = await Promise.all(promises);
        res.status(200).json(allNodes);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const getAllNodesAde = async (req, res) => {
    try {
        const { id } = req.params;
        let allNodes = await Nodes.find({ home: id, type: relayType, isADE: true });
        res.status(200).json(allNodes);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const getAllNodesSensors = async (req, res) => {
    try {
        const { id } = req.params;
        const allNodesSensors = await Nodes.find({ home: id, type: sensorType });

        res.status(200).json(allNodesSensors);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const getNode = async (req, res) => {
    try {
        const { id } = req.params;

        let dataRes = {};

        const node = await Nodes.findById(id);
        if (node?.room) {
            const room = await Rooms.findById(node?.room);
            node.room = room;
        }

        dataRes.node = node;

        if (node?.type === 'Relay') {
            const promises = await node.channels.map(async (channelId) => {
                const channel = new Promise((resolve, reject) => {
                    resolve(Channels.findById(channelId));
                });
                return channel;
            });

            dataRes.channels = await Promise.all(promises);
        }

        if (dataRes?.channel) {
            const promises = await dataRes?.channel.map(async (channel) => {
                if (channel.type === 'Device') {
                    const device = new Promise((resolve, reject) => {
                        resolve(Devices.findById(channel.link));
                    });
                    return device;
                } else if (channel.type === 'Room') {
                    const room = new Promise((resolve, reject) => {
                        resolve(Rooms.findById(channel.link));
                    });
                    return room;
                } else if (channel.type === 'Home') {
                    const home = new Promise((resolve, reject) => {
                        resolve(Homes.findById(channel.link));
                    });
                    return home;
                }
            });

            dataRes.devices = await Promise.all(promises);
        }

        res.status(200).json(dataRes);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const deleteNode = async (req, res) => {
    try {
        const { id, homeId } = req.params;
        const home = await Homes.findById(homeId);
        const node = await Nodes.findById({ _id: id });

        const leaveRequest = {
            dev_addr: node.address,
        };

        mqttSendMess(home.mqttPath + '/leave_req', leaveRequest);

        const promises = await node?.channels.map(async (channel) => {
            const channelFind = new Promise((resolve, reject) => {
                resolve(Channels.findById(channel));
            });

            return channelFind;
        });

        const channels = await Promise.all(promises);

        const promisesChannel = channels.map((channel) => {
            if (channel?.typeLink === 'Devices') {
                new Promise((resolve, reject) => {
                    resolve(
                        Devices.findOneAndUpdate(
                            { _id: channel?.link },
                            { relay: null },
                            { new: true },
                        ),
                    );
                });
            } else if (channel?.typeLink === 'Rooms') {
                new Promise((resolve, reject) => {
                    resolve(
                        Rooms.findOneAndUpdate(
                            { _id: channel?.link },
                            { relay: null },
                            { new: true },
                        ),
                    );
                });
            } else if (channel?.typeLink === 'Homes') {
                new Promise((resolve, reject) => {
                    resolve(
                        Homes.findOneAndUpdate(
                            { _id: channel?.link },
                            { relay: null },
                            { new: true },
                        ),
                    );
                });
            }

            new Promise((resolve, reject) => {
                resolve(Channels.findByIdAndDelete(channel?._id));
            });

            return;
        });

        await Promise.all(promisesChannel);
        await Nodes.findByIdAndDelete({ _id: id });

        res.status(200).json({ message: 'Delete Success!' });
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const editNode = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, room } = req.body.body;

        await Nodes.findOneAndUpdate({ _id: id }, { name: name, room: room }, { new: true });

        res.status(201).json('Change status success!!');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getRelay = async (req, res) => {
    try {
        const { id } = req.params;
        const relay = await Channels.findById(id);

        res.status(200).json(relay);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const getSensor = async (req, res) => {
    try {
        const { id } = req.params;
        res.status(200).json(await Sensors.findOne({ address: id }));
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const getAdeInfor = async (req, res) => {
    try {
        const { id } = req.params;
        res.status(200).json(await Ades.find({ address: id }));
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};

export const changeStateRelay = async (req, res) => {
    try {
        const { id } = req.params;
        const { mqttPath } = req.body.body;

        const channel = await Channels.findById(id);

        const controlRelay = {
            dev_addr: channel.address,
            channel: channel.channel,
        };

        mqttSendMess(mqttPath + '/control', controlRelay);

        const newUpdate = await Channels.findByIdAndUpdate(id, {
            state: !channel.state,
        });

        res.status(200).json(newUpdate);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};
