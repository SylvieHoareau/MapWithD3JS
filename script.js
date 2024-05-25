// Récupérer les dimensions du conteneur
const getContainerDimensions = () => {
    const containerWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const containerHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    return { containerWidth, containerHeight };
}

// Définir les dimensions de la carte en fonction des dimensions du conteneur
const setDimensions = () => {
    const { containerWidth, containerHeight } = getContainerDimensions();
    const width = containerWidth;
    const height = containerHeight * 0.6; // Ratio de 600/960 = 0.625, arrondi à 0.60 pour simplifier
    return { width, height };
};

// Créer un élément SVG
const resizeSVG = () => {
    const { width, height } = setDimensions();
    const svg = d3.select("#map").select("svg");
    if (svg.empty()) {
        // L'élément SVG n'existe pas encore, on le crée
        const newSvg = d3.select("#map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Mettre à jour les dimensions du conteneur #map
        d3.select("#map")
            .style("width", width + "px")
            .style("height", height + "px");
    } else {
        // L'élément SVG existe déjà, on met à jour ses dimensions
        svg
            .attr("width", width)
            .attr("height", height);

        // Mettre à jour les dimensions du conteneur #map
        d3.select("#map")
          .style("width", width + "px")
          .style("height", height + "px");
    }
}

window.addEventListener('resize', resizeSVG);

resizeSVG(); // Appel initial pour redimensionner à la charge de la page

// Sélection de l'élément tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("font-size", "12px")
    .style("pointer-events", "none")

// Définir le générateur de graticule
const graticule = d3.geoGraticule();

// Fonction pour dessiner la carte

const drawMap = (data) => {

    // Récupérer les dimensions actuelles de l'élément SVG
    const { width: svgWidth, height: svgHeight } = setDimensions();

    const svg = d3.select('#map svg')
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Définir une projection géographique
    const projection = d3.geoMercator()
        .center([55.5364, -21.1151]) // Coordonnées approximatives du centre de La Réunion
        .scale(50000) // Ajuster l'échelle pour zoomer sur la carte
        .translate([svgWidth / 2, svgHeight / 2]);

    // Mettre à jour la projection en fonction des nouvelles dimensions
    projection.fitSize([svgWidth, svgHeight], data);

    // Définir un générateur de chemins pour proeter les données géographiques
    const path = d3.geoPath().projection(projection);

    // Mettre à jour le générateur de chemins en fonction de la nouvelle projection
    path.projection(projection);

    // Définir une échelle de couleur pour la densité
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, d3.max(data.features, d => d.properties.DENSITY)]);

    // Redessiner les communes avec les nouvelles dimensions et la nouvelle projection
    const communes = svg.selectAll("path")
        .data(data.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => colorScale(d.properties.DENSITY))
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5) 
        // Evénements de survol pour afficher les info-bulles
        .on("mouseover", (event, d) => {
            const population = d.properties.POPULATION;
            const surface = d.properties.AIRE;
            const communeName = d.properties.NOM;
            // Info-bulle lors du clic
            tooltip
                .html(`<strong>${communeName}</strong><br>Population : ${population.toLocaleString()} habitants<br>Surface : ${surface.toLocaleString()} km²`)
                .style("visibility", "visible")
                .style("left", (event.pageX + 10)+"px")
                .style("top", (event.pageY - 28)+"px");
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });
    
    // Redessiner le texte des noms de communes avec les nouvelle dimensions et la nouvelle projection
    const communeNames = svg.selectAll("text")
        .data(data.features)
        .join("text")
        .attr("class", "commune-name")
        .attr("x", d => path.centroid(d)[0])
        .attr("y", d => path.centroid(d)[1])
        .attr("font-size", `${(window.innerWidth / 100) *2}px`)
        .attr("fill", "#000")
        .text(d => d.properties.NOM);

    // Légende
    const legendWidth = 300;
    const legendHeight = 20;

    // Groupe SVG pour la légende
    const legendGroup = svg.selectAll(".legend-group")
        .data([null])
        .join("g")
        .attr("class", "legend-group")
        .attr("transform", `translate(${20}, ${svgHeight -50})`);

    const gradient = legendGroup.selectAll("defs")
        .data([null])
        .join("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(0));

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(d3.max(data.features, d => d.properties.DENSITY)));

    legendGroup.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient");

    const legendScale = d3.scaleLinear()
        .domain([0, d3.max(data.features, d => d.properties.DENSITY)])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5);

    legendGroup.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);

    // Calculer l'échelle actuelle de la projection
    const scale = projection.scale();

    // Groupe SVG pour l'échelle
    const scaleGroup = svg.selectAll(".scale-group")
        .data([null])
        .join("g")
        .attr("class", "scale-group")
        .attr("transform", `translate(${svgWidth - 120}, ${svgHeight - 30})`);

    // Element de texte pour afficher l'échelle
    scaleGroup.append("text")
        .data([null])
        .join("text")
        .attr("x", svgWidth - 100)
        .attr("y", svgHeight - 30)
        .attr("font-size", "12px")
        .attr("text-anchor", "end")
        .text(`Echelle: 1:${scale.toFixed(0)}`);

    // Définir le générateur de graticule
    const graticule = d3.geoGraticule();

    // Groupe SVG pour l'orientation
    const graticuleGroup = svg.selectAll(".graticule-group")
        .data([null])
        .join("g")
        .attr("class", "graticule-group")
        .attr("transform", `translate(${svgWidth - 100}, ${svgHeight - 60})`);

    // Ajouter un élément de chemin pour dessiner le graticule
    graticuleGroup.selectAll("path")
        .data([graticule()])
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5)
        .attr("d", path);
}


// Charger les données GeoJSON de La Réunion
d3.json("reunion.geojson")
    .then(data => {
        drawMap(data);
    })
    .catch(error => {
    console.error("Erreur lors du chargement des données GeoJSON : ", error);
});
