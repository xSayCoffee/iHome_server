import mongoose from "mongoose";

const NodesSchema = new mongoose.Schema(
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
    },
    type: {
      type: String,
      min: 2,
      max: 50,
    },
    address: {
      type: String,
      min: 2,
      max: 50,
    },
    link: {
      type: String,
    },
    typeLink: {
      type: String,
    },
    numChannel: {
      type: Number,
    },
    isADE: {
      type: Boolean,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    channels: {
      type: Array,
    },
  },
  { timestamps: true }
);

const Nodes = mongoose.model("Nodes", NodesSchema);
export default Nodes;
