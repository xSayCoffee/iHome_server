import Channels from "../models/Channels.js";
import Homes from "../models/Homes.js";
import HomesMember from "../models/HomesMember.js";
import Nodes from "../models/Nodes.js";

export const addHomes = async (req, res) => {
  try {
    const { name, address, mqttPath } = req.body.body;
    const picturePath = req.body.body.picturePath.path;

    const newHome = new Homes({
      name,
      address,
      mqttPath,
      picturePath,
    });

    const savedHome = await newHome.save();

    const newHomesMember = new HomesMember({
      home: savedHome._id,
      user: req.params.id,
      access: "admin",
      privilege: "host",
      rooms: [],
    });

    await newHomesMember.save();

    res.status(201).json(savedHome);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getHome = async (req, res) => {
  try {
    const { id } = req.params;

    const home = await Homes.findById(id);
    res.status(200).json(home);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getAllHomes = async (req, res) => {
  try {
    const { id } = req.params;
    const membersHomes = await HomesMember.find({ user: id });

    // const promises = await membersHomes.map(async (membersHome) => {
    //   const home = new Promise((resolve, reject) => {
    //     resolve(Homes.findById(membersHome.home));
    //   });
    //   // const homeReturn = { ...home, ...membersHome };

    //   return { ...home, ...membersHome };
    // });

    // const homes = await Promise.all(promises);
    // // const promises_2 = await homes.map(async (home, index) => {
    // //   return { ...home, ...membersHomes[index] };
    // // });
    // // const homesReturn = await Promise.all(promises_2);
    // console.log(homes);
    res.status(200).json(membersHomes);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getAllHomesUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const membersHomes = await HomesMember.find({ user: id });

    const promises = await membersHomes.map(async (membersHome) => {
      const home = new Promise((resolve, reject) => {
        resolve(Homes.findById(membersHome.home));
      });

      return home;
    });

    const homes = await Promise.all(promises);

    res.status(200).json(homes);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getHomeUser = async (req, res) => {
  try {
    const { homeId, userId } = req.params;
    const membersHome = await HomesMember.findOne({
      home: homeId,
      user: userId,
    });

    res.status(200).json(membersHome);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const linkHomes = async (req, res) => {
  try {
    const { home, relay } = req.body.body;

    const homeReturn = await Homes.findByIdAndUpdate(home, { relay: relay });
    await Channels.findByIdAndUpdate(relay, { link: home, typeLink: "Home" });

    res.status(201).json(homeReturn);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const unLinkHome = async (req, res) => {
  try {
    const { relayChannel, home } = req.body.body;

    const homeReturn = await Homes.findOneAndUpdate(
      { _id: home },
      { relay: null },
      { new: true }
    );

    await Channels.findOneAndUpdate(
      { _id: relayChannel },
      { typeLink: "", link: "" },
      { new: true }
    );

    res.status(201).json(homeReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const linkHomesSensor = async (req, res) => {
  try {
    const { home, sensor } = req.body.body;

    const homeReturn = await Homes.findByIdAndUpdate(home, { sensor: sensor });
    await Nodes.findByIdAndUpdate(sensor, { link: home, typeLink: "Home" });

    res.status(201).json(homeReturn);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const unLinkHomeSensor = async (req, res) => {
  try {
    const { sensor, home } = req.body.body;

    const homeReturn = await Homes.findOneAndUpdate(
      { _id: home },
      { sensor: null },
      { new: true }
    );

    await Nodes.findOneAndUpdate(
      { _id: sensor },
      { typeLink: "", link: "" },
      { new: true }
    );

    res.status(201).json(homeReturn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
