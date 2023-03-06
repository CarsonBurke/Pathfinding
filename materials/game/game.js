class Game {
    
    running = false
    origins
    goals
    graph = new Uint8Array()
    visited = new Uint8Array()
    pathGraph = new Uint32Array()
    path = []
    /**
     * The coord from which the best score was found from
     */
    pathFrom = []

    constructor() {

        this.ID = env.newID()

        env.games[this.ID] = this
    }
    run() {
        if (!this.running) {
            this.visualize()
            return
        }

        while (this.floodGenGraph.size) {

            let nextFloodGen = new Set()

            for (const packedCoord of this.floodGenGraph) {

                const coord = unpackCoord(packedCoord)

                for (const offset of adjacentOffsets) {

                    const adjCoord = {
                        x: coord.x + offset.x,
                        y: coord.y + offset.y
                    }

                    // We're outside the map

                    if (!isXYInGraph(adjCoord.x, adjCoord.y)) continue

                    const packedAdjcoord = packCoord(adjCoord)

                    if (this.graph[packedAdjcoord] === 255) continue
                    
                    if (this.visited[packedAdjcoord] === 1) continue
                    this.visited[packedAdjcoord] = 1
                    
                    nextFloodGen.add(packedAdjcoord)
                    this.pathFrom[packedAdjcoord] = coord
                    this.pathGraph[packedAdjcoord] = this.findCostOfCoord(adjCoord)
                }
            }
            
            this.floodGenGraph = nextFloodGen
            break
        }

        for (const packedCoord of this.goals) {
            
            if (!this.floodGenGraph.has(packedCoord)) continue

            // We have reached a goal, record the path

            this.path.push(unpackCoord(packedCoord))
            let nextCoord = this.pathFrom[packedCoord]
            while (nextCoord) {

                this.path.push(nextCoord)
                nextCoord = this.pathFrom[packCoord(nextCoord)]
            }

            this.running = false
        }

        if (!this.floodGenGraph.size) this.running = false

        this.visualize()
    }
    findCostOfCoord(coord) {

        const goalCost = findLowestCost(coord, this.goals)
        const originCost = findLowestCost(coord, this.origins)
     
        return goalCost + originCost
    }
    reset() {

        this.init()
    }
}

Game.prototype.init = function() {

    this.running = true
    this.graph = new Uint8Array(env.graphSize * env.graphSize)
    this.visited = new Uint8Array(env.graphSize * env.graphSize)
    this.pathGraph = new Uint32Array(env.graphSize * env.graphSize)
    this.pathFrom = []
    this.path = []

    this.origins = [packXY(25, 25)]
    this.floodGenGraph = new Set(this.origins)
    for (const packedCoord of this.floodGenGraph) this.visited[packedCoord] = 1

    this.goals = new Set([packXY(2, 2), packXY(1, 1)])

    for (let x = 0; x < env.graphSize; x++) {
        for (let y = 0; y < env.graphSize; y++) {

            this.graph[packXY(x, y)] = 0
        }
    }

    let coords = findCoordsInsideRect(15, 10, 30, 20)

    for (const coord of coords) {

        this.graph[packCoord(coord)] = 255
    }

    coords = findCoordsInsideRect(8, 30, 25, 90)

    for (const coord of coords) {

        this.graph[packCoord(coord)] = 255
    }

    coords = findCoordsInsideRect(8, 90, 25, 100)

    for (const coord of coords) {

        this.graph[packCoord(coord)] = 20
    }

    coords = findCoordsInsideRect(50, 60, 80, 80)

    for (const coord of coords) {

        this.graph[packCoord(coord)] = 255
    }

    coords = findCoordsInsideRect(26, 60, 50, 80)

    for (const coord of coords) {

        this.graph[packCoord(coord)] = 30
    }

    coords = findCoordsInsideRect(65, 5, 80, 60)

    for (const coord of coords) {

        this.graph[packCoord(coord)] = 255
    }

    coords = findCoordsInsideRect(50, 0, 60, 55)

    for (const coord of coords) {

        this.graph[packCoord(coord)] = 255
    }

    coords = findCoordsInsideRect(60, 80, 70, 95)

    for (const coord of coords) {

        this.graph[packCoord(coord)] = 255
    }

    coords = findCoordsInsideRect(61, 0, 64, 10)

    for (const coord of coords) {

        this.graph[packCoord(coord)] = 50
    }
}

Game.prototype.visualize = function() {

    // Draw flood values

    for (let x = 0; x < env.graphSize; x++) {
        for (let y = 0; y < env.graphSize; y++) {

            let color = `hsl(570${this.graph[packXY(x, y)] * 1.7}, 100%, 60%)`
            if (this.visited[packXY(x, y)] === 1 && this.graph[packXY(x, y)] === 0) color = 'blue'
            env.cm.fillStyle = color

            env.cm.beginPath();
            env.cm.fillRect(x * env.coordSize, y * env.coordSize, env.coordSize, env.coordSize);
            env.cm.stroke();
        }
    }

    for (let x = 0; x < env.graphSize; x++) {
        for (let y = 0; y < env.graphSize; y++) {

            const packedCoord = packXY(x, y)

            const coordFrom = this.pathFrom[packedCoord]
            if (coordFrom) {
                /* const coordFrom = unpackCoord(packedCoordFrom) */
                /* console.log(x, y, coordFrom) */
                env.cm.strokeStyle = '#ff0000';
                env.cm.beginPath();
                env.cm.moveTo(x * env.coordSize + env.coordSize * 0.5, y * env.coordSize + env.coordSize * 0.5);
                env.cm.lineTo(coordFrom.x * env.coordSize+ env.coordSize * 0.5, coordFrom.y * env.coordSize + env.coordSize * 0.5);
                env.cm.stroke();
            }

            env.cm.fillStyle = 'white'
            env.cm.font = "15px Arial";
            env.cm.textAlign = "center";
            env.cm.fillText(this.pathGraph[packedCoord].toString(), x * env.coordSize + env.coordSize * 0.5, y * env.coordSize + env.coordSize * 0.75);
        }
    }

    // Draw goals

    for (const packedCoord of this.goals) {

        const coord = unpackCoord(packedCoord)

        env.cm.drawImage(document.getElementById('x'), coord.x * env.coordSize, coord.y * env.coordSize, env.coordSize, env.coordSize)
    }

    for (const coord of this.path) {

        env.cm.fillStyle = 'green'

        env.cm.beginPath();
        env.cm.fillRect(coord.x * env.coordSize, coord.y * env.coordSize, env.coordSize, env.coordSize);
        env.cm.stroke();
    }
}