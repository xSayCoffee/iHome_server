import Ades from "../models/Ades.js";
import Channels from "../models/Channels.js";

/* READ */
export const getAde = async (req, res) => {
  try {
    const { id } = req.params;
    const relay = await Channels.findById(id);
    const data = await Ades.find({ address: relay.address });
    res.status(200).json({ relay: relay, data: data });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
