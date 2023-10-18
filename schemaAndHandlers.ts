import {
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	GraphQLInt,
	GraphQLList,
    GraphQLFloat,
} from "graphql";

import prisma from "./prisma";

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
            radius:{
                type: GraphQLNonNull(GraphQLFloat),
                resolve: (region) => region.radius,
            }
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
		};
	},
});

const rootQueryType = new GraphQLObjectType({
	name: "Query",
	description: "Root Query",
	fields: () => {
		return {
			injury: {
				description: "A Single Book",
				type: GraphQLString,
				args: {
					name: { type: GraphQLNonNull(GraphQLString) },
				},
				resolve: (parent, args) => {
					return "book asked";
				},
			},
			injuries: {
				type: new GraphQLList(InjuryType),
				description: "List of injuries reported",
				resolve: async() => {
                    return await prisma.injuryReport.findMany();
                },
			},
		};
	},
});

const rootMutationType = new GraphQLObjectType({
	name: "Mutation",
	description: "Root Mutation",
	fields: () => ({
		addBook: {
			type: GraphQLString,
			description: "Add book",
			args: {
				name: { type: GraphQLNonNull(GraphQLString) },
			},
			resolve: (parent, args, context) => {
				return JSON.stringify(context) + args.name;
			},
		},
	}),
});

const schema = new GraphQLSchema({
	query: rootQueryType,
	mutation: rootMutationType,
});

export { schema };
