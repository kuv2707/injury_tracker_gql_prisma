import {
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	GraphQLInt,
	GraphQLList,
	GraphQLFloat,
	GraphQLInputObjectType,
	GraphQLError
} from "graphql";

import prisma from "./prisma";
import { BSON } from "bson";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from 'google-auth-library';
// import { config } from "dotenv";
// config();

const jwt_secret: string = "asdfghjkl;asdfghjkl;"

const RegionType = new GraphQLObjectType({
	name: "Region",
	description: "Represents a region on the body where an injury has occured",
	fields: () => {
		return {
			x: {
				type: GraphQLNonNull(GraphQLFloat),
				resolve: (region) => region.x,
			},
			y: {
				type: GraphQLNonNull(GraphQLFloat),
				resolve: (region) => region.y,
			},
			radius: {
				type: GraphQLNonNull(GraphQLFloat),
				resolve: (region) => region.radius,
			},
		};
	},
});

const InjuryType = new GraphQLObjectType({
	name: "Injury",
	description:
		"This represents an injury, which includes the name of reporter, timestamp, and locations where injury has occured",
	fields: () => {
		return {
			name_reporter: {
				type: GraphQLNonNull(GraphQLString),
				resolve: (injury) => injury.name_reporter,
			},
			timestamp: {
				type: GraphQLNonNull(GraphQLString),
				resolve: (injury) => injury.timestamp,
			},
			body_map: {
				type: new GraphQLList(RegionType),
				resolve: (injury) => {
					return injury.body_map;
				},
			},
			id: {
				type: GraphQLNonNull(GraphQLString),
				resolve: (injury) => injury.id,
			},
		};
	},
});


const UserType = new GraphQLObjectType({
	name: "User",
	description: "Represents a user",
	fields: () => ({
		id: {
			type: GraphQLNonNull(GraphQLString),
			resolve: (user) => user.id,
		},
		name: {
			type: GraphQLNonNull(GraphQLString),
			resolve: (user) => user.name,
		},
		email: {
			type: GraphQLNonNull(GraphQLString),
			resolve: (user) => user.email,
		},
	}),
});


const AuthResponseType = new GraphQLObjectType({
	name: "AuthResponse",
	description: "Represents an authentication response",
	fields: () => ({
		user: { type: UserType },
		token: { type: GraphQLString },
	}),
});

//read all injuries/one injury (by id)
const rootQueryType = new GraphQLObjectType({
	name: "Query",
	description: "Root Query",
	fields: () => {
		return {
			injury: {
				description: "A Single injury",
				type: InjuryType,
				args: {
					id: { type: GraphQLNonNull(GraphQLString) },
				},
				resolve: async (parent, args, context) => {
					return await prisma.injuryReport.findFirst({
						where: {
							id: args.id,
							//todo:
							// userId:context.user.id
						},
					});
				},
			},
			injuries: {
				type: new GraphQLList(InjuryType),
				description: "List of injuries reported",
				resolve: async (parent, args, context) => {
					return await prisma.injuryReport.findMany({
						//todo:
						// where:{
						// 	userId:context.user.id
						// }
					});
				},
			},
			deleteInjury: {
				type: InjuryType,
				description: "Delete an injury",
				args: {
					id: { type: GraphQLNonNull(GraphQLString) },
				},
				resolve: async (parent, args) => {
					console.log(args.id);
					return await prisma.injuryReport.delete({
						where: {
							id: args.id,
							//todo: userId: context.user.id
						},
					});
				},
			},
			updateInjury: {
				type: InjuryType,
				description: "Update an injury",
				args: {
					id: { type: GraphQLNonNull(GraphQLString) },
					name_reporter: { type: (GraphQLString) },
					timestamp: { type: GraphQLString },
					body_map: {
						type: GraphQLList(GraphQLNonNull(RegionInputType)),
					},
				},
				resolve: async (parent, args, context) => {
					const data: any = {};
					const modif = ["name_reporter", "timestamp", "body_map"];
					for (let k of modif) {
						if (!!args[k]) {
							data[k] = args[k];
						}
					}
					return await prisma.injuryReport.update({
						where: {
							id: args.id,
							//todo: userId: context.user.id,
						},
						data,
					});
				},
			},
			me: {
				type: UserType,
				resolve: (parent, args, context) => {
					// Implement authentication logic here (e.g., check for JWT token).
					// Return the authenticated user or null if not authenticated.
				},
			},
		};
	},
});

const RegionInputType = new GraphQLInputObjectType({
	name: "RegionInput",
	description: "Represents a region on the body where an injury has occured",
	fields: () => {
		return {
			x: {
				type: GraphQLNonNull(GraphQLFloat),
			},
			y: {
				type: GraphQLNonNull(GraphQLFloat),
			},
			radius: {
				type: GraphQLNonNull(GraphQLFloat),
			},
		};
	},
});

const ErrorResponseType = new GraphQLObjectType({
	name: "ErrorResponse",
	description: "Represents an error response",
	fields: () => ({
		error: { type: GraphQLString },
	}),
});

//create injury
const rootMutationType = new GraphQLObjectType({
	name: "Mutation",
	description: "Root Mutation",
	fields: () => ({
		addInjury: {
			type: InjuryType,
			description: "Add an injury.",
			args: {
				name_reporter: { type: GraphQLNonNull(GraphQLString) },
				timestamp: { type: GraphQLString },
				body_map: {
					type: GraphQLList(GraphQLNonNull(RegionInputType)),
				},
			},
			resolve: async (parent, args, context) => {
				const newinj = await prisma.injuryReport.create({
					data: {
						name_reporter: args.name_reporter,
						body_map: args.body_map,
						id: new BSON.ObjectId().toString(),
						userId: new BSON.ObjectId().toString(),//todo:  =context.user.id
					},
				});
				return newinj;
			},
		},
		signup: {
			type: AuthResponseType,
			args: {
				name: { type: GraphQLNonNull(GraphQLString) },
				email: { type: GraphQLNonNull(GraphQLString) },
				password: { type: GraphQLNonNull(GraphQLString) },
			},
			resolve: async (_, args, context) => {
				let user = await prisma.user.findFirst({
					where: {
						email: args.email
					}
				});
				if (user) {
					throw new GraphQLError("User already registered");
				}
				const token = jwt.sign({ email: args.email }, jwt_secret);
				const hashedPassword = await bcrypt.hash(args.password, 10);
				user = await prisma.user.create({
					data: {
						name: args.name,
						email: args.email,
						password: hashedPassword
					}
				})
				context.user = user;
				return {
					token,
					user
				}
			},
		},
		login: {
			type: AuthResponseType,
			args: {
				email: { type: GraphQLNonNull(GraphQLString) },
				password: { type: GraphQLNonNull(GraphQLString) },
			},
			resolve: async (_, args, context) => {
				const user = await prisma.user.findFirst({
					where: {
						email: args.email
					}
				})
				if (!user) {
					throw new GraphQLError("User doesn't exist");
				}
				const isMatch = await bcrypt.compare(args.password, user.password);
				if (!isMatch) throw new GraphQLError("Check Credentials!");
				const token = jwt.sign({ email: args.email }, jwt_secret);
				return {
					token,
					user
				}
			},
		},
		googleOAuth: {
			type: AuthResponseType,
			args: {
				googleAccessToken: { type: GraphQLNonNull(GraphQLString) },
			},
			resolve: async (parent, args, context) => {
				const { googleAccessToken } = args;

				const googleClientId = 'LmFvboQZxZAcKydKFOdVlo7wfv06rLTx';
				const client = new OAuth2Client(googleClientId);

				try {
					const ticket = await client.verifyIdToken({
						idToken: googleAccessToken,
						audience: googleClientId,
					});

					const payload: any = ticket.getPayload();

					let user = await prisma.user.findFirst({
						where: {
							email: payload.email,
						},
					});

					// if (!user) {
					// 	const newUser = await prisma.user.create({
					// 		data: {
					// 			name: payload.name,
					// 			email: payload.email,
					// 		},
					// 	});
					// 	// Associate newUser with the user variable
					// 	user = newUser;
					// }

					// Generate an authentication token
					const token = jwt.sign({ email: payload.email }, jwt_secret);

					return {
						token,
						user,
					};
				} catch (error: any) {
					throw new Error(error.message);
				}
			},
		},
	})
},
);

const schema = new GraphQLSchema({
	query: rootQueryType,
	mutation: rootMutationType,
});

export { schema };
