import mongoose from "mongoose";

const SensorsSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    temp: {
      type: Number,
    },
    humidity: {
      type: Number,
    },
    airquality: {
      type: Number,
    },
  },
  { timestamps: true }
);

const Sensors = mongoose.model("Sensors", SensorsSchema);
export default Sensors;
