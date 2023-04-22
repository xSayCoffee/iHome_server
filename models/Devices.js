import mongoose from "mongoose";

const DevicesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    home: {
      type: Object,
      required: true,
    },
    room: {
      type: Object,
      required: true,
    },
    relay: {
      type: Object,
    },
  },
  { timestamps: true }
);

const Devices = mongoose.model("Devices", DevicesSchema);
export default Devices;
