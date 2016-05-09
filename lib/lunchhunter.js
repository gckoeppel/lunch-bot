"use strict";

var LunchHunter = function () {
  var $          = require( "cheerio" ),
      _          = require( "underscore" ),
      request    = require( "request" ),
      util       = require( 'util' ),
      Slack      = require( 'node-slack' ),
      workDays = [ 1, 2, 3, 4, 5 ], // 1 is Monday, 2 Tuesday, 3 Wednesday
      restaurants = [
        {
          name: "Swisscom Restaurang Binz",
          url : "http://swisscom-binz.sv-group.ch/de.html"
        }
  ];

  String.prototype.replaceAll = function ( search, replacement ) {
    var target = this;
    return target.replace( new RegExp( search, 'g' ), replacement );
  };

  var getOffers = function ( html ) {
    var results = [], offers = $.load( html )( '.offer' );

    var prepareDescription = function ( string ) {
      return removeWhitespace( string ).replaceAll( 'Regular CHF 8.00/10.60', '' ).replaceAll( 'Small CHF 6.00/8.00', '' ).replaceAll( ' Zubereitungszeit', '. Zubereitungszeit' );
    }

    var removeWhitespace = function ( string ) {
      return string.replaceAll( "\n", ' ' ).replaceAll( "\t", '' ).replaceAll( '  ', ' ' ).trim();
    }

    _.each( offers, function ( offer ) {
      results.push(
        {
          title      : removeWhitespace( $( offer ).find( '.offer-description' ).text() ),
          description: prepareDescription( $( offer ).find( '.maindish .title' ).text() + " \u2014 " + $( offer ).find( '.maindish .trimmings' ).text() ),
        }
      )
    } );

    return results;
  };

  var postToSlack = function ( restaurant, offers ) {
    var slack = new Slack( process.env.LUNCH_SLACK_URL );

    var fields = function () {
      var results = [];
      _.each( offers, function ( offer ) {
        results.push(
          {
            "title": offer.title,
            "value": offer.description,
            "short": true,
          }
        );
      } );

      return results;
    }();

    console.log( "Posting to Slack..." );

    slack.send(
      {
        text       : {
          toString: function () {
            return ''
          }
        },
        channel    : '#general',
        username   : 'LunchHunter',
        icon_emoji : ':fork_and_knife:',
        attachments: [ {
          "title"   : restaurant.name,
          "fallback": 'Bald ist Essenszeit!',
          "color"   : "#7CD197",
          "fields"  : fields
        } ]
      }
    );
  };

  var checkCafeteria = function ( restaurant ) {
    request( restaurant.url, function ( err, response, body ) {
      console.log( util.format( 'Fetching menu for %s...', restaurant.name ) );
      if ( !err && response.statusCode === 200 ) {
        // Get offers from page
        var offers = getOffers( body );

        console.log( util.format( "Found %d offers!", offers.length ) );

        // Post them in Slack
        postToSlack( restaurant, offers );

        console.log( "Done!\n" );
      } else {
        console.log( "There was an error while fetching the menu :(\n" );
      }
    } );
  };

  var runBoyRun = function () {
    _.each( restaurants, checkCafeteria );
  };

  return {
    run: function () {
      if ( _.contains( workDays, new Date().getDay() ) ) {
        console.log( "Let's see what we're going to eat today!\n" );
        runBoyRun();
      } else {
        console.log( "No work day, nothing to do here..." );
      }
    }
  }
}

module.exports = LunchHunter;
