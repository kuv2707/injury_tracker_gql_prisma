import express, { Request, Response } from "express";
import { graphqlHTTP } from "express-graphql";
const app = express();

import { schema } from "./schemaAndHandlers";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: express.Response) => {
	res.send("Hello World");
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
	console.log("Server running on port 3000");
});
