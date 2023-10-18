import express, { Request } from "express";
import { graphqlHTTP } from "express-graphql";
const app = express();

import { schema } from "./schemaAndHandlers";

app.get("/", (req: Request, res: express.Response) => {
	res.send("Hello World");
});

app.use(
	"/graphql",
	graphqlHTTP({
		graphiql: true,
		schema: schema,
		context: {
			foo: "bar",
		},
	})
);


app.listen(3000, () => {
    console.log("Server running on port 3000");
});