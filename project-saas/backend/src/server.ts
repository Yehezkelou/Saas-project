import express from "express"
import route from "./routes/auth.routes"


const app = express()


// connection au system Auth
app.use("/saas/api/auth", route)



app.listen(3000, ()=> { console.log("serveur running on http://localhost:3000/") })