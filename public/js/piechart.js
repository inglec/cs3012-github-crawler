// Modified version of http://bl.ocks.org/dbuezas/9306799

var scale = 0.5;	// Scale pie chart to fit labels within SVG element

var svg, width, height;
var pieWidth, pieHeight, radius;
var pie, arc, outerArc;

function drawCommitsPieChart(data) {
    svg = d3.select("svg");
    width  = parseInt(svg.style("width"), 10);
    height = parseInt(svg.style("height"), 10);

    pieWidth  = width * scale;
    pieHeight = height * scale;
    radius    = pieWidth/2;

    svg = svg.append("g");
    svg.append("g")
      .attr("class", "slices");
    svg.append("g")
      .attr("class", "labels");
    svg.append("g")
      .attr("class", "lines");

    pie = d3.layout.pie()
      .sort(null)
      .value(function(d) {
        return d.commits;
    });

    arc = d3.svg.arc()
      .outerRadius(radius * 0.9) // Pie size
      .innerRadius(0);           // Hole radius

    outerArc = d3.svg.arc()
      .innerRadius(radius) // Text line radius
      .outerRadius(radius);

    svg.attr("transform", "translate(" + width/2 + "," + height/2 + ")");

    change(data);
}

function change(data) {
  /* ------- PIE SLICES -------*/
  var slice = svg.select(".slices").selectAll("path.slice")
  .data(pie(data));

  slice.enter()
    .insert("path")
    .style("fill", function getRandomColour() {
      var letters = '0123456789ABCDEF';
      var colour = '#';
      for (var i = 0; i < 6; i++)
        colour += letters[Math.floor(Math.random() * 16)];
      return colour;
    })
    .attr("class", "slice");

  slice
    .transition().duration(1000)
    .attrTween("d", function(d) {
    this._current = this._current || d;
    var interpolate = d3.interpolate(this._current, d);
    this._current = interpolate(0);
    return function(t) {
      return arc(interpolate(t));
    };
  })

  slice.exit()
    .remove();

  /* ------- TEXT LABELS -------*/
  var text = svg.select(".labels").selectAll("text")
  .data(pie(data));

  text.enter()
    .append("text")
    .attr("dy", ".50em")
    .text(function(d) {
    return d.data.repo;
  });

  function midAngle(d){
    return d.startAngle + (d.endAngle - d.startAngle)/2;
  }

  text.transition().duration(1000)
    .attrTween("transform", function(d) {
    this._current = this._current || d;
    var interpolate = d3.interpolate(this._current, d);
    this._current = interpolate(0);
    return function(t) {
      var d2 = interpolate(t);
      var pos = outerArc.centroid(d2);
      pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
      return "translate("+ pos +")";
    };
  })
    .styleTween("text-anchor", function(d){
    this._current = this._current || d;
    var interpolate = d3.interpolate(this._current, d);
    this._current = interpolate(0);
    return function(t) {
      var d2 = interpolate(t);
      return midAngle(d2) < Math.PI ? "start":"end";
    };
  });

  text.exit()
    .remove();

  /* ------- SLICE TO TEXT POLYLINES -------*/
  if (data[0].repo != null) {
      var polyline = svg.select(".lines").selectAll("polyline")
      .data(pie(data));

      polyline.enter()
        .append("polyline");

      polyline.transition().duration(1000)
        .attrTween("points", function(d){
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
          return [arc.centroid(d2), outerArc.centroid(d2), pos];
        };
      });

      polyline.exit()
        .remove();
    }
};
