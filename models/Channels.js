import mongoose from "mongoose";

const ChannelsSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    channel: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    link: {
      type: String,
    },
    typeLink: {
      type: String,
    },
    linkWithNode: {
      type: Array,
    },
    state: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

const Channels = mongoose.model("Channels", ChannelsSchema);
export default Channels;
