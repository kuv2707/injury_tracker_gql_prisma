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
		picture_url: {
			type: GraphQLNonNull(GraphQLString),
			resolve: (user) => user.picture_url,
		},
		nickname: {
			type: GraphQLNonNull(GraphQLString),
			resolve: (user) => user.nickname,
		}
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
							userId:context.user.unique_id
						},
					});
				},
			},
			injuries: {
				type: new GraphQLList(InjuryType),
				description: "List of injuries reported",
				resolve: async (parent, args, context) => {
					console.log(context.user)
					return await prisma.injuryReport.findMany({
						//todo:
						where:{
							userId:context.user.unique_id
						}
					});
				},
			},
			deleteInjury: {
				type: InjuryType,
				description: "Delete an injury",
				args: {
					id: { type: GraphQLNonNull(GraphQLString) },
				},
				resolve: async (parent, args,context) => {
					console.log(args.id,context.user);
					return await prisma.injuryReport.delete({
						where: {
							id: args.id,
							userId: context.user.unique_id
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
							userId: context.user.unique_id,
						},
						data,
					});
				},
			},
			profile: {
				type: UserType,
				resolve: (parent, args, context) => {
					return context.user;
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
				console.log(context.user)
				const newinj = await prisma.injuryReport.create({
					data: {

						name_reporter: args.name_reporter,
						body_map: args.body_map,
						id: new BSON.ObjectId().toString(),
						userId: context.user.unique_id,
					},
				});
				return newinj;
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
