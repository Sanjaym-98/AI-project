function routes(app){
    app.use("/v1/documentSummary",require('./modules/documentSummary/index'));
    app.use("/v1/imageGeneration",require('./modules/imageGeneration/index'));
    app.use("/v1/semanticSearch",require('./modules/semanticSearch/index'));
    app.get("/health", (req, res) => {
        res.status(200).send("OK");
    });
}


module.exports= routes