/*
 *  Preparing a cmd line interface to add/remove/reset
 *  mongoose fixtures using a config-file
 *
 *  By default configFile is set to mongoose-fixture-config
 *  and as a result the config checking will try to load it
 *  from the current-working directory.  All of this can be overriden
 *  passing in the configFile argument which can be an abs value
 *
 */
var npmPackage = require('../package.json');
var fs = require('fs');
var argv = require('optimist')
    .usage('MongooseFixture is a command line interface to load fixture data into mongodb')
    .options('configFile',{
        alias:'c',
        default:'mongoose-fixture-config.js'
    })
    .options('fixture',{
        alias:'f',
        default:''
    })
    .options('generateFixture',{
        alias:'gf',
        default:''
    })
    .options('generateSchema',{
        alias:'gs',
        default:''
    })
    .options('generateConfig',{
        alias:'gc',
        default:''
    })
    .boolean('add')
    .boolean('remove')
    .boolean('reset')
    .argv;




// load out mongoose fixture module
var MongooseFixture = require('./MongooseFixture');

var run = function(){
// TODO:
// Research how to make file-system calls cross-platform for windows since
// '/' are not used and not sure ./ is required to include local files
var configFile = argv.configFile
// create out var stubb
var fixtureConfig = [];


/* 
   First Command to Process is generating a config 
   file as the rest of the commands require config 
   paths
*/
// process command generateConfig
if(argv.generateConfig){
    // access our boilerplate directory and get source
    var sourceConfigPath = __dirname+'/BoilerPlates/config.js';
    
    // create file name, should add check to see if .js was passed in argument
    var configFileName = '';
    if(argv.generateConfig !== '' && argv.generateConfig !== true){
        configFileName = argv.generateConfig;    
    } else {
        configFileName = 'mongoose-fixture-config.js';
    } 
        
    // load the boilerplate fixture-config template 
    // from our source
    var fixtureSource = fs.readFileSync(sourceConfigPath, 'utf-8');

    // relative dir path
    var relativeCommandPath = fs.realpathSync();
    var finalTargetPath = relativeCommandPath+'/'+configFileName; 
    
    // check if the current finalTarget exists
    var targetExists = fs.existsSync(finalTargetPath);
    
    // display fileExists message, to prevent overwriting
    // file
    if(targetExists){
        console.log('Specified Config -> ',finalTargetPath);
        console.log('Exists, please use a different name');
        process.exit();
    }

    // setup our tag replacements
    var htmlReplacements = {
            '__configName__':configFileName, 
            '__version__':npmPackage.version,
            '__localDir__':relativeCommandPath
    };
        
    //for key in htmlReplacements
    for(var key in htmlReplacements){
        // convert to a regex so that all instances of __localDir__ are replaced
        // using the 'g'
        var regexKey = new RegExp(key, 'g');
        fixtureSource = fixtureSource.replace(regexKey,htmlReplacements[key]);
    }
        
    console.log('Generating Fixture-Config -> '+finalTargetPath);
    fs.writeFileSync(finalTargetPath, fixtureSource);
    
    // exit process     
    process.exit();
}


// TODO finalize the two additional pathing inputs with error handling
// Next step in processing is we expect that a config file
// reference was passed, begin resolving and loading config
// check if it is local pathing or abs
// check if abs path since it has '/' slash
if(configFile.substring(0,1) === '/'){
    // know the path so load file
    // should work if u give an abs
    fixtureConfig = require(configFile);
} else {
    // need to determine if the path is a relative or local lookup
    // if there are no '/' in path string then local lookup
    if(configFile.search('/') === -1){
        // means we are targeting the local path so look it up
        // relative dir path
        var relativeCommandPath = fs.realpathSync();
        var target = relativeCommandPath+'/'+configFile;
        var exists = fs.existsSync(target);
        if(exists){
            // if is is local directory lookup need ./
            fixtureConfig = require(target);
        } else {
            console.log('Could not load config file ', target);
            process.exit();
        }
    } else {
        // try and load using the pathing
        // do exists check, but this could be hard
        fixtureConfig = require(configFile);
    }
}

// Third Process, check if fixture/schema is being generated
// Generating these will put them in their defined path from config
// TODO put in file exists check to prevent overwriting a fixture/schema
if(argv.generateFixture !== '' || argv.generateSchema !==''){
    
    var sourceSchemaPath = __dirname+'/BoilerPlates/schema.js';
    var sourceDataFixturePath = __dirname+'/BoilerPlates/data-fixture.js';

    if(argv.generateFixture !== ''){
        // create file name, should add check to see if .js was passed in argument
        var fixtureFileName = argv.generateFixture+'.js';
        
        // load the fixture-config template from our source - boilerplate
        // should check that source config was loaded
        var fixtureSource = fs.readFileSync(sourceDataFixturePath, 'utf-8');
        // get path from config where to save data-fixture
        var targetDataFixturePath = fixtureConfig.paths.dataFixturePath;
 
        // now that the string buffer is ready lets write it
        var finalTargetPath = targetDataFixturePath+fixtureFileName;

        // setup our tag replacements
        var htmlReplacements = {
            '__dataFixtureName__':fixtureFileName, 
            '__version__':npmPackage.version
        };
        
        //for key in htmlReplacements
        for(var key in htmlReplacements){
            fixtureSource = fixtureSource.replace(key,htmlReplacements[key]);
        }


        
        
        console.log('Generating DataFixture -> '+finalTargetPath);
        fs.writeFileSync(finalTargetPath, fixtureSource);
    }


    if(argv.generateSchema !== ''){
        // create file name, should add check to see if .js was passed in argument
        var schemaFileName = argv.generateSchema+'.js';
        // form fixtureConfig get the path were we plan to write our generated fixture
        var targetSchemaPath = fixtureConfig.paths.schemaPath;
        // load the fixture template from our source - boilerplate
        var schemaSource = fs.readFileSync(sourceSchemaPath, 'utf-8');

        // now that the string buffer is ready lets write it
        var finalTargetPath = targetSchemaPath+schemaFileName;

        // check if the current finalTarget exists
        var targetExists = fs.existsSync(finalTargetPath);
    
        // display fileExists message, to prevent overwriting
        // file
        if(targetExists){
            console.log('Specified Schema -> ',finalTargetPath);
            console.log('Exists, please use a different name or delete before writing');
            process.exit();
        }

        // setup our tag replacements
        var htmlReplacements = {
            '__schemaName__':schemaFileName,
            '__version__':npmPackage.version
        };
        
        //for key in htmlReplacements
        for(var key in htmlReplacements){
            schemaSource = schemaSource.replace(key,htmlReplacements[key]);
        }
        
        console.log('Generating Schema -> '+finalTargetPath);
        fs.writeFileSync(finalTargetPath, schemaSource);
    }
 
    // exit
    process.exit();
}


// simple check to see if a fixture was set
if(argv.fixture === ''){
    console.log('--Fixture needs specified');
    process.exit();
}

console.log('loading fixtures from - '+configFile);

// load our fixture listing from config
var fixtureListing = fixtureConfig.fixtureListings.get(argv.fixture);

// check that the given fixtureListing key has a match
if(fixtureListing === undefined){
    console.log('Unable to locate fixture listing -> '+argv.fixture);
    process.exit();
// and has fixutres to load
} else if(fixtureListing.length == 0){
    console.log('Fixture '+argv.fixture+' found but is empty');
    process.exit();
}

// make sure we have an action, otherwise mongo connection will be made and no
// disconnect will happen causing the cmd line to hang
if(argv.add === false && argv.reset === false && argv.remove === false){
    console.log('Required fixure action (add/reset/remove) was specified');
    process.exit();
}

// include mongoose
var mongoose = require('mongoose');
// get database name from config :)
var mongoSettings = fixtureConfig.mongoConnection;
var mongoConnectionString = mongoSettings.host+':'+mongoSettings.port+'/'+mongoSettings.dbname; 
mongoose.connect('mongodb://'+mongoConnectionString);

// instantiate an instance of mongoose-fixture 
// to scope hoist mongoose and fixtureConfig listings
var mongooseFixture = MongooseFixture(fixtureListing, mongoose);
    

// Handle fixture actions
if(argv.add){
    mongooseFixture.add(); 
}

if(argv.reset){
    mongooseFixture.reset();
}

if(argv.remove){
    // call removal
    mongooseFixture.remove();
}

}
module.exports = run;
