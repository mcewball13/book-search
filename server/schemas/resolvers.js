const { AuthenticationError } = require("apollo-server-express");
const { User, Book } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const user = await User.findOne({ _id: context.user._id })
                    .select("-__v -password")
                    .populate("savedBooks");

                return user;
            }
            throw new AuthenticationError("Not Logged In!");
        },
        users: async (parent, args, context) => {
            return User.find({})
                .select("-__v -password")
                .populate("savedBooks");
        },
    },
    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError("Incorrect Credentials!");
            }
            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError("Incorrect Credentials!");
            }
            const token = signToken(user);

            return { token, user };
        },
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },
        saveBook: async (parent, { input }, context) => {
            if (context.user) {
                const userData = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    {
                        $push: {
                            savedBooks: input,
                        },
                    },
                    { new: true }
                );
                return userData;
            }
            throw new AuthenticationError("You need to be logged in!");
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const removeBook = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: {bookId} } },
                    { new: true }
                );
                return removeBook;
            }
            throw new AuthenticationError("You need to be logged in!");
        },
    },
};
module.exports = resolvers;
