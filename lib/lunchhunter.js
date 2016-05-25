'use strict';

var LunchHunter = function () {
  var $          = require( 'cheerio' ),
    _          = require( 'underscore' ),
    request    = require( 'request' ),
    util       = require( 'util' ),
    Slack      = require( 'node-slack' ),
    entities   = new ( require( 'html-entities' ).AllHtmlEntities )(),

    workDays = [ 1, 2, 3, 4, 5 ], // 1 is Monday, 2 Tuesday, 3 Wednesday
    restaurants = [
    {
      name: 'Swisscom Restaurant Binz',
      url : 'http://swisscom-binz.sv-group.ch/de.html',
      color: '#173B81',
      parser: svParser
    },
    {
      name: 'Swiss Life Restaurant Binz49',
      url : 'https://zfv.ch/de/microsites/swiss-life-restaurant-binz49/menueplan',
      color: '#d82034',
      parser: zfvParser
    },
    {
      name: 'Binz 38',
      url : 'http://www.binz-38.ch/home/',
      color: '#ec6730',
      parser: binz38Parser
    }
  ];

  String.prototype.replaceAll = function ( search, replacement ) {
    var target = this;
    return target.replace( new RegExp( search, 'g' ), replacement );
  };

  function escapeHTML ( input ) {
    var doc = new DOMParser().parseFromString( input, 'text/html' );
    return doc.documentElement.textContent;
  }

  function removeWhitespace ( string ) {
    return string.replaceAll( '\r', '' ).replaceAll( '\n', ' ' ).replaceAll( '\t', '' ).replaceAll( '  ', ' ' ).trim();
  }


  /**
   * parses menu offers from sv-group webpage
   * @param html html body of webpage
   * @return array of offers
   */
  function svParser( html ) {
    var results = [], offers = $.load( html )( '.offer' );

    var prepareDescription = function(offer) {

    return removeWhitespace(
      $( offer ).find( '.maindish .title' ).text()) + ' \u2014 '
      + removeWhitespace($( offer ).find( '.maindish .trimmings' ).text()).replace( /\sMit/, '\nMit' ) + '\n'
      + '_' + $( offer ).find( '.price' ).text() + '_';
    }
    _.each( offers, function ( offer ) {
      results.push(
        {
          title      : removeWhitespace( $( offer ).find( '.offer-description' ).text() ),
          description: prepareDescription( offer )
        }
      )
    } );

    return results;
  };

  /**
   * parses menu offers from zfv webpage
   * @param html html body of webpage
   * @return array of offers
   */
  function zfvParser( html ) {
    var today = new Date().toISOString().replace( /T.*/, '' );
    var results = [], offers = $.load( html )( `table.menu tr[data-date=${today}]` );
    //
    var prepareDescription = function( offer ) {
      return entities.decode(
        removeWhitespace(
          $( offer ).find( 'td:last-child' ).html()
        )
        .replace( /(Fleisch|Fisch): \w+.*<br>/, '' ) // remove provenance for the sake of brevity
        .replace( /CHF.*/g, '\_$&\_' )               // make price italic
        .replace( /\s+/g, ' ' )                      // remove extra white space
        .replace( /\s*(<br>)+\s*/g, '\n' )           // replace <br> with newline
      );
    }

    _.each( offers, function ( offer ) {
      results.push(
        {
          title      : removeWhitespace( $( offer ).find( 'td:first-child' ).text() ),
          description: prepareDescription( offer )
        }
      )
    } );

    return results;
  };

  /**
   * parses menu offers binz38 webpage
   * @param html html body of webpage
   * @return array of offers
   */
  function binz38Parser( html ) {
    var results = [];
    // get the menu items from very unsemantically formated html
    var offers = entities.decode(
      removeWhitespace(
        $.load( html )( '.showcase_text' ).eq( 0 ).html()
      )
    );
    // regex to the rescue!
    var regex = /([^<>\/]*)(<br>|<b>){1,}(\d*\.\d*)/g;
    var match = regex.exec( offers )
    var counter = 1;
    while (match != null) {
      // matched text: match[0]
      // capturing group n: match[n]
      results.push(
        {
          title      : 'Menu ' + counter++,
          description: `${match[1]}\n_CHF ${match[3]}_`
        }
      );
      match = regex.exec(offers)
    }
    return results;
  };

  var postToSlack = function ( restaurant, offers ) {
    var slack = new Slack( process.env.LUNCH_SLACK_URL );

    var fields = function () {
      var results = [];
      _.each( offers, function ( offer ) {
        results.push(
          {
            'title': offer.title,
            'value': offer.description,
            'short': true,
          }
        );
      } );

      console.log( results );
      return results;
    }();

    console.log( 'Posting to Slack...' );

    slack.send(
    //console.log(
      {
        text       : {
          toString: function () {
            return ''
          }
        },
        channel    : '#lunch',
        username   : 'LunchHunter',
        icon_emoji : ':fork_and_knife:',
        attachments: [ {
          'title'   : restaurant.name,
          'fallback': 'Bald ist Essenszeit!',
          'color'   : restaurant.color,
          'mrkdwn_in': ['text', 'pretext', 'fields'],
          'fields'  : fields
        } ]
      }
    );
  };

  var checkCafeteria = function ( restaurant ) {
    request( restaurant.url, function ( err, response, body ) {
      console.log( util.format( 'Fetching menu for %s...', restaurant.name ) );
      if ( !err && response.statusCode === 200 ) {
        // Get offers from page
        console.log(restaurant);
        var offers = restaurant.parser( body );

        console.log( util.format( 'Found %d offers!', offers.length ) );

        // Post them in Slack
        postToSlack( restaurant, offers );

        console.log( 'Done!\n' );
      } else {
        console.log( 'There was an error while fetching the menu :(\n' );
      }
    } );
  };

  var runBoyRun = function () {
    _.each( restaurants, checkCafeteria );
  };

  return {
    run: function () {
      if ( _.contains( workDays, new Date().getDay() ) ) {
        console.log( 'Let\'s see what we\'re going to eat today!\n' );
        runBoyRun();
      } else {
        console.log( 'No work day, nothing to do here...' );
      }
    }
  }
}

module.exports = LunchHunter;
