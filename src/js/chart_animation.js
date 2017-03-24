/**
 * USING CHARTIST.JS LIBRARY http://gionkunz.github.io/chartist-js
 * These are settings and functions for animation.
 * Snitched from https://github.com/gionkunz/chartist-js/issues/688
 * Not much to see here.
 * 
 * **/

function makePartyChart(data) {
    var pChart = new Chartist.Bar('#partyChart', data);

    pChart.on('draw', function(data) {
        if (data.type === 'bar') {
            data.element.attr({
                style: 'stroke-width: 0px'
            });
            var strokeWidth = 10;

            for (var s = 0; s < data.series.length; ++s) {
                if (data.seriesIndex === s) {
                    data.element.animate({
                        y2: {
                            begin: s * 500,
                            dur: 500,
                            from: data.y1,
                            to: data.y2,
                            easing: Chartist.Svg.Easing.easeOutSine
                        },
                        'stroke-width': {
                            begin: s * 500,
                            dur: 1,
                            from: 0,
                            to: strokeWidth,
                            fill: 'freeze'
                        }
                    }, false);
                }
            }
        }
    });
}

function makeGenderChart(data) {
    var gChart = new Chartist.Bar('#genderChart', data);

    gChart.on('draw', function(data) {
        if (data.type === 'bar') {
            data.element.attr({
                style: 'stroke-width: 0px'
            });
            var strokeWidth = 10;

            for (var s = 0; s < data.series.length; ++s) {
                if (data.seriesIndex === s) {
                    data.element.animate({
                        y2: {
                            begin: s * 500,
                            dur: 500,
                            from: data.y1,
                            to: data.y2,
                            easing: Chartist.Svg.Easing.easeOutSine
                        },
                        'stroke-width': {
                            begin: s * 500,
                            dur: 1,
                            from: 0,
                            to: strokeWidth,
                            fill: 'freeze'
                        }
                    }, false);
                }
            }
        }
    });
}