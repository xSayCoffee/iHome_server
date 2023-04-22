import mongoose from "mongoose";

const AdesSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    irms: {
      type: Number,
    },
    vrms: {
      type: Number,
    },
    power: {
      type: Number,
    },
  },
  { timestamps: true }
);

const Ades = mongoose.model("Ades", AdesSchema);
export default Ades;
