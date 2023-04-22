import mongoose from "mongoose";

const HomesMemberSchema = new mongoose.Schema(
  {
    home: {
      type: String,
      require: true,
    },
    user: {
      type: String,
      require: true,
    },
    access: {
      type: String,
      require: true,
    },
    privilege: {
      type: String,
      require: true,
    },
    rooms: {
      type: Array,
    },
  },
  { timestamps: true }
);

const HomesMember = mongoose.model("HomesMember", HomesMemberSchema);
export default HomesMember;
