import {
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	GraphQLInt,
	GraphQLList,
	GraphQLFloat,
	GraphQLInputObjectType,
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
				resolve: async (parent,args,context) => {
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
					const data:any = {};
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
	}),
});

const schema = new GraphQLSchema({
	query: rootQueryType,
	mutation: rootMutationType,
});

export { schema };
