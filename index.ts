import express, { Request, Response } from "express";
import { graphqlHTTP } from "express-graphql";
const app = express();

import { schema } from "./schemaAndHandlers";
import { auth } from "express-openid-connect";
import { requiresAuth } from "express-openid-connect";
import prisma from "./prisma";
import { BSON } from "bson";
import { json } from "stream/consumers";

const config = {
	authRequired: false,
	auth0Logout: true,
	secret: "fhgkjregehgjkfbnfgbjkgnmegfkjbfb2441nlgmgfnj",
	baseURL: "http://localhost:3000",
	clientID: "LmFvboQZxZAcKydKFOdVlo7wfv06rLTx",
	issuerBaseURL: "https://dev-xfulotfa0wxqhmv8.us.auth0.com",
};

app.use(auth(config));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req: Request, res: express.Response) => {
	if (req.oidc.isAuthenticated() && req.oidc.user) {
		console.log("creating");
		if((await prisma.user.findFirst({where:{unique_id:req.oidc.user.sub}}))===null)
		{
			await prisma.user.create({
				data: {
					id: new BSON.ObjectId().toString(),
					unique_id: req.oidc.user.sub,
					name: req.oidc.user.name,
					email: req.oidc.user.email,
					picture_url: req.oidc.user.picture_url,
					nickname: req.oidc.user.nickname,
				},
			});

		}
	}
	res.send(
		(req.oidc.isAuthenticated() ? "Logged in" : "Logged out") +
			JSON.stringify(req.oidc.user)
	);
});

app.use((req: any, _, next: express.NextFunction) => {
	// console.log(req.query);
	req.user = req.oidc.user;
	req.user.unique_id = req.oidc.user.sub;
	next();
});

app.get("/profile", requiresAuth(), (req, res) => {
	res.send(JSON.stringify(req.oidc.user));
});

app.use(
	"/graphql",
	graphqlHTTP((req) => {
		const options = {
			graphiql: true,
			schema: schema,
			context: req,
		};

		return options;
	})
);

app.listen(3000, () => {
	console.log("Server running on http://localhost:3000");
});
