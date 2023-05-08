import HomesMember from '../models/HomesMember.js';
import User from '../models/User.js';

export const getAllMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const membersHomes = await HomesMember.find({ home: id });

        const promises = await membersHomes.map(async (membersHome) => {
            const member = new Promise((resolve, reject) => {
                resolve(User.findById(membersHome.user));
            });

            return member;
        });

        const members = await Promise.all(promises);

        res.status(200).json({ members: members, homesMembers: membersHomes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getMembersByEmail = async (req, res) => {
    try {
        const { email } = req.params;

        const members = await User.find({ email: email });

        res.status(200).json(members);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const addMemberHome = async (req, res) => {
    try {
        const { home, user, access, rooms } = req.body.body;
        const roomsId = rooms.map((room) => room._id);
        console.log(roomsId);

        const newHomesMember = new HomesMember({
            home: home,
            user: user,
            access: access,
            privilege: access,
            rooms: roomsId,
        });

        const saveHomeMember = await newHomesMember.save();

        res.status(200).json(saveHomeMember);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deteleMemberHome = async (req, res) => {
    try {
        const { home, member } = req.params;

        await HomesMember.findOneAndDelete({ home: home, user: member });

        res.status(200).json({ message: 'Delete Success!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
