const graphql = require("graphql");
const User = require("../models/user");
const Post = require("../models/post");
const Like = require("../models/like");
const Role = require("../models/role");
const Comment = require("../models/comment");
require("dotenv").config();

const jsonwebtoken = require("jsonwebtoken");
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
} = graphql;

//Schema defines data on the Graph like object types(book type), relation between
//these object types and describes how it can reach into the graph to interact with
//the data to retrieve or mutate the data

const PostType = new GraphQLObjectType({
  name: "Post",
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    date: { type: GraphQLString },
    claps: {
      type: GraphQLInt,
      resolve(parent, args) {
        return Like.count(Like.find({ postID: parent.id }));
      },
    },
    author: {
      type: UserType,
      resolve(parent, args) {
        return User.findById(parent.authorID);
      },
    },
    comments: {
      type: new GraphQLList(CommentType),
      resolve(parent, args) {
        return Comment.find({ postID: parent.id });
      },
    },
  }),
});

//adding comments in post in graphql how?
const CommentType = new GraphQLObjectType({
  name: "Comment",
  fields: () => ({
    id: { type: GraphQLID },
    post: {
      type: PostType,
      resolve(parent, args) {
        return Post.findById(parent.postID);
      },
    },
    content: { type: GraphQLString },
    images: { type: GraphQLString },
    author: {
      type: UserType,
      resolve(parent, args) {
        return User.findById(parent.authorID);
      },
    },
    reply: {
      type: CommentType,
      resolve(parent, args) {
        return Comment.findById(parent.replyTo);
      },
    },
  }),
});

const LikeType = new GraphQLObjectType({
  name: "Like",
  fields: () => ({
    id: { type: GraphQLID },
    liker: {
      type: UserType,
      resolve(parent, args) {
        return User.findById(parent.likerID);
      },
    },
    post: {
      type: PostType,
      resolve(parent, args) {
        return Post.findById(parent.postID);
      },
    },
  }),
});

const RoleType = new GraphQLObjectType({
  name: "Role",
  fields: () => ({
    id: { type: GraphQLID },
    role: { type: GraphQLString },
    authorities: { type: new GraphQLList(GraphQLString) },
  }),
});

const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    age: { type: GraphQLInt },
    email: { type: GraphQLString },
    role: {
      type: RoleType,
      resolve(parent, args) {
        return Role.findById(args.role);
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve(parent, args) {
        return Post.find({ authorID: parent.id });
      },
    },
  }),
});

//RootQuery describe how users can use the graph and grab data.
//E.g Root query to get all authors, get all books, get a particular
//book or get a particular author.
const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    post: {
      type: PostType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return Post.findById(args.id);
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      resolve(parent, args) {
        return Post.find({});
      },
    },
    role: {
      type: RoleType,
      args: {
        id: { type: GraphQLID },
      },
      resolve(parent, args) {
        return Role.findById(args.id);
      },
    },
    roles: {
      type: new GraphQLList(RoleType),
      resolve(parent, args) {
        return Role.find({});
      },
    },
    user: {
      type: UserType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return User.findById(args.id);
      },
    },
    users: {
      type: new GraphQLList(UserType),
      resolve(parent, args) {
        return User.find({});
      },
    },
    comments: {
      type: new GraphQLList(CommentType),
      resolve(parent, args) {
        return Comment.find({});
      },
    },
  },
});

//Very similar to RootQuery helps user to add/update to the database.
const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addUser: {
      type: UserType,
      args: {
        //GraphQLNonNull make these field required
        name: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
        roleID: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(parent, args) {
        let curUser = new User({
          name: args.name,
          age: args.age,
          email: args.email,
          password: args.password,
          roleID: args.roleID,
        });
        return curUser.save();
      },
    },
    addRole: {
      type: RoleType,
      args: {
        role: { type: new GraphQLNonNull(GraphQLString) },
        authorities: {
          type: new GraphQLList(GraphQLString),
        },
      },
      resolve(parent, args) {
        let role = new Role({
          role: args.role,
          authorities: args.authorities,
        });
        return role.save();
      },
    },
    login: {
      type: GraphQLString,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args) {
        const user = await User.findOne({ email: args.email });

        if (!user) {
          throw new Error("No user with that email");
        }
        //const valid = bcrypt.compare(args.password,user.password)

        const valid = args.password === user.password;

        if (!valid) {
          throw new Error("Incorrect password");
        }

        // return json web token
        return jsonwebtoken.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );
      },
    },
    addPost: {
      type: PostType,
      args: {
        title: { type: new GraphQLNonNull(GraphQLString) },
        content: { type: new GraphQLNonNull(GraphQLString) },
        authorID: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve(parent, args, { user }) {
        if (!user) {
          throw new Error("You are not authenticated!");
        }
        let post = new Post({
          title: args.title,
          content: args.content,
          authorID: args.authorID,
        });
        return post.save();
      },
    },
    addLike: {
      type: LikeType,
      args: {
        likerID: { type: new GraphQLNonNull(GraphQLString) },
        postID: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(parent, args) {
        let like = new Like({
          likerID: args.likerID,
          postID: args.postID,
        });
        return like.save();
      },
    },
    addComment: {
      type: CommentType,
      args: {
        content: { type: new GraphQLNonNull(GraphQLString) },
        images: { type: GraphQLString },
        replyTo: { type: GraphQLString },
        postID: { type: new GraphQLNonNull(GraphQLString) },
        authorID: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(parent, args, { user }) {
        if (!user) {
          throw new Error("You are not authenticated!");
        }
        let comment = new Comment({
          content: args.content,
          images: args.images,
          replyTo: args.replyTo,
          authorID: args.authorID,
          postID: args.postID,
        });
        return comment.save();
      },
    },
    deleteComment: {
      type: CommentType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve(parent, args) {
        return Comment.deleteMany(Comment.findById(args.id));
      },
    },
  },
});

//Creating a new GraphQL Schema, with options query which defines query
//we will allow users to use when they are making request.
module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
