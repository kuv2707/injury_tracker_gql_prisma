import express, { Request, Response } from "express";
import { graphqlHTTP } from "express-graphql";
const app = express();

import { schema } from "./schemaAndHandlers";
import { auth } from 'express-openid-connect';
import { requiresAuth } from 'express-openid-connect';

const config = {
	authRequired: false,
	auth0Logout: true,
	secret: 'fhgkjregehgjkfbnfgbjkgnmegfkjbfb2441nlgmgfnj',
	baseURL: 'http://localhost:3000',
	clientID: 'LmFvboQZxZAcKydKFOdVlo7wfv06rLTx',
	issuerBaseURL: 'https://dev-xfulotfa0wxqhmv8.us.auth0.com'
};

app.use(auth(config));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: express.Response) => {
	res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

interface RequestWithBody extends express.Request {
	body: { [key: string]: string | undefined };
	query: { [key: string]: string | undefined };
}

app.use(
	(
		req: RequestWithBody,
		res: express.Response,
		next: express.NextFunction
	) => {
		// console.log(req.query);
		next();
	}
);

app.get('/profile', requiresAuth(), (req, res) => {
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
