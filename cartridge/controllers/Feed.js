'use strict';


var server = require('server');

var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');


server.get('Xml', function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

    var apiProductSearch = new ProductSearchModel();
    var viewData = {
        apiProductSearch: apiProductSearch
    };
    res.setViewData(viewData);

    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var result = searchHelper.search(req, res);

        if (result.searchRedirect) {
            res.redirect(result.searchRedirect);
            return;
        }

        if (result.category && result.categoryTemplate) {
            template = result.categoryTemplate;
        }

        res.render('feed/googleFeed', {
            productSearch: result.productSearch,
            maxSlots: result.maxSlots,
            reportingURLs: result.reportingURLs,
            refineurl: result.refineurl,
            category: result.category ? result.category : "root",
            canonicalUrl: result.canonicalUrl,
            schemaData: result.schemaData
        });
    });
    return next();
}, pageMetaData.computedPageMetaData);

server.get('Item',  function (req, res, next) {
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var urlHelper = require('*/cartridge/scripts/helpers/removeDiacriticsHelpers');

    // The req parameter has a property called querystring. In this use case the querystring could
    // have the following:
    // pid - the Product ID
    // ratings - boolean to determine if the reviews should be shown in the tile.
    // swatches - boolean to determine if the swatches should be shown in the tile.
    //
    // pview - string to determine if the product factory returns a model for
    //         a tile or a pdp/quickview display
    var productTileParams = { pview: 'fullProduct' };
    Object.keys(req.querystring).forEach(function (key) {
        productTileParams[key] = req.querystring[key];
    });

    var product;

    try {
        product = ProductFactory.get(productTileParams);
        name = urlHelper.removeDiacritics(product.productName).replace(/\s+/g,"-");
    } catch (e) {
        product = false;
    }

    var context = {
        product: product,
        name: name,
        display: {}
    };

    Object.keys(req.querystring).forEach(function (key) {
        if (req.querystring[key] === 'true') {
            context.display[key] = true;
        } else if (req.querystring[key] === 'false') {
            context.display[key] = false;
        }
    });

    res.render('feed/googleFeedItem.isml', context);

    next();
});

module.exports = server.exports();