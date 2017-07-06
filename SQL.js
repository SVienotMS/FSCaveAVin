var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var tempCreateBouteille = require('./CreateBouteille');


// Create connection to Database
var config = {
    userName: "FabSeb",
    password: "Lfgbh123!",
    server: "fscavevinsqlserver.database.windows.net",
    options: {
        database: 'FSCaveavin',
        encrypt: true
    }
};


function insertLigneSQL(args, callback) {

    var connection = new Connection(config);
    var ArraySQLRequest;

    switch(args[0]) {
        case 'InsertCouleur':
            ArraySQLRequest = "INSERT INTO dbo.Couleur VALUES ((SELECT max(CouleurID) FROM dbo.Couleur) + 1, " +
            	  "'" + args[1] + "', " +
	              "getdate(), getdate(), null)";
            break;
        case 'InsertAppellation':
            ArraySQLRequest = "INSERT INTO dbo.Appellation VALUES ((SELECT max(AppellationID) FROM dbo.Appellation) + 1, " +
            	  "1, '" + args[1] + "', " +
	              "getdate(), getdate(), null)";
            break;
        case 'InsertEmplacementBouteille':
            ArraySQLRequest = "INSERT INTO dbo.EmplacementBouteille VALUES (" + args[1] + ", " + args[2] + ")";
            break;
    }

    connection.on('connect', function(err) {
        if (err) {
            console.log(err);
        } else {
            
            console.log("Inserting a new ligne into database");
            console.log(ArraySQLRequest);

            request = new Request(ArraySQLRequest, function(err, rowCount, rows) {
                console.log(rowCount + ' row(s) inserted');
                if (rowCount >= 1) {
                    callback(rowCount);
                } else {
                    callback(null);
                }
            });

            connection.execSql(request);

        }
    });
}


function queryArraySQL(args, callback) {

    var connection = new Connection(config);
    var ArraySQL = [];
    var ArraySQLRequest;

    switch(args[0]) {
        case 'AfficherCouleursDisponibles':
            ArraySQLRequest = "SELECT distinct top(10) c.Couleur FROM dbo.Bouteille as b " +
                              "inner join dbo.EmplacementBouteille as eb with (nolock) on eb.BouteilleID = b.BouteilleID " +
                              "inner join dbo.Couleur as c with (nolock) on c.CouleurID = b.CouleurID " +
                              "ORDER BY c.Couleur";
            break;
        case 'AfficherCouleurs':
            ArraySQLRequest = "SELECT distinct top(10) Couleur FROM dbo.Couleur " +
                              "ORDER BY Couleur";
            break;
        case 'AfficherAppellationsDisponibles':
            ArraySQLRequest = "SELECT distinct top(10) a.Appellation " +
                              "From dbo.Bouteille as b " +
                              "inner join dbo.EmplacementBouteille as eb with (nolock) on eb.BouteilleID = b.BouteilleID " +
                              "inner join dbo.Appellation as a with (nolock) on a.AppellationID = b.AppellationID " +
                              "inner join dbo.Couleur as c with (nolock) on c.CouleurID = b.CouleurID " +
                              "WHERE c.Couleur = '" + args[1] + "' " +
                              "ORDER BY a.Appellation";
            break;
        case 'AfficherAppellation1stLetter' :
            ArraySQLRequest = "SELECT distinct top(10) Appellation FROM dbo.Appellation WHERE Appellation like '" +
                              args[1] + "%'";
            break;
        case 'BouteilleExistante':
            ArraySQLRequest = "SELECT distinct top(10) b.BouteilleNom " +
                              "FROM dbo.Bouteille as b " +
                              "inner join dbo.Couleur as c with (nolock) on c.CouleurID = b.CouleurID " +
                              "WHERE b.BouteilleNom = '" + args[1] + "' " +
                              "and c.Couleur = '" + args[2] + "' " +
                              "and b.AnneeMillesime = " + args[3];
            break;
        case 'RechercheEmplacementLibre':
            ArraySQLRequest = "SELECT TOP(" + args[1] + ") e.Num_Emplacement, c.Etage, e.EmplacementID " +
                              "FROM dbo.Emplacement as e " + 
                              "inner join dbo.Clayette as c with (nolock) on c.ClayetteID = e.ClayetteID " +
                              "WHERE EmplacementID NOT IN (SELECT DISTINCT EmplacementID FROM dbo.EmplacementBouteille)";
            break;
        case 'RechercheBouteilleID':
            ArraySQLRequest = "SELECT b.BouteilleID " +
                              "FROM dbo.Bouteille as b " +
                              "inner join dbo.Couleur as c with (nolock) on b.CouleurID = c.CouleurID " +
                              "WHERE b.BouteilleNom = '" + args[1] + "' " +
                              "and b.AnneeMillesime = " + args[2] + " " +
                              "and c.Couleur = '" + args[3] + "'";
            break;
    }

    connection.on('connect', function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Connected');
            console.log('Reading from db');
            console.log(ArraySQLRequest);

            request = new Request(ArraySQLRequest, function(err, rowCount, rows) {
                    console.log(rowCount + ' rows returned');
                    if (rowCount >= 1) {
                        callback(ArraySQL);
                    } else {
                        callback(null);
                    }
                }
            );

            request.on('row', function(columns) {
                columns.forEach(function(column) {
                    console.log('%s\t%s', column.metadata.colName, column.value);
                    ArraySQL.push(column.value);          
                });
            });

            connection.execSql(request);
        }
    });
}


function queryCouleurAppellationsbyMaturationSQL(args, callback) {

    var connection = new Connection(config);
    var nbrow = 0;
    var ResultsSQL = [];
    var ArraySQLRequest = "Select distinct top(10) " +
      "b.BouteilleNom Bouteille, c.Couleur, a.Appellation, b.AnneeMillesime Millesime, b.AnneeMaturation Maturation " + 
      "FROM dbo.Bouteille as b " + 
      "inner join dbo.EmplacementBouteille as eb with (nolock) on eb.BouteilleID = b.BouteilleID " +
      "inner join dbo.Couleur as c with (nolock) on b.CouleurID = c.CouleurID " +
      "inner join dbo.Appellation as a with (nolock) on b.AppellationID = a.AppellationID " +
      "WHERE c.Couleur = '" + args[0] + "' and a.Appellation = '" + args[1] + "' " +
      "ORDER BY b.AnneeMaturation";

    console.log(ArraySQLRequest);

    connection.on('connect', function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Connected');

            console.log('Reading from db');

            request = new Request(ArraySQLRequest, function(err, rowCount, rows) {
                    console.log(rowCount + ' rows returned');
                    if (rowCount >= 1) {
                        for(var myKey in ResultsSQL) {
                            console.log("name:"+ResultsSQL[myKey].Bouteille+", Appellation:"+ResultsSQL[myKey].Appellation);
                        }
                        callback(ResultsSQL);
                    } else {
                        callback(null);
                    }
                }
            );

            request.on('row', function(columns) {
                var objRows = [];
                columns.forEach(function(column) {
    				objRows.push({ key:column.metadata.colName, value:column.value });
                });
    			ResultsSQL.push(objRows);
            });

            connection.execSql(request);
        }
    });
}


function queryBouteilleFullDetailsSQL(args, callback) {

    var connection = new Connection(config);
    var nbrow = 0;
    var ResultsSQL = [];
    var ArraySQLRequest = "Select b.BouteilleNom Bouteille, c.Couleur, a.Appellation, p.Pays, " +
                          "b.AnneeMillesime Millesime, b.AnneeMaturation Maturation, b.AnneeMax Expiration, " +
                          "b.CodeBarre, b.Commentaires, " +
                          "cl.Etage, e.Num_Emplacement " +
                          "FROM dbo.Bouteille as b " +
                          "inner join dbo.EmplacementBouteille as eb with (nolock) on eb.BouteilleID = b.BouteilleID " +
                          "inner join dbo.Couleur as c with (nolock) on b.CouleurID = c.CouleurID " +
                          "inner join dbo.Appellation as a with (nolock) on b.AppellationID = a.AppellationID " +
                          "inner join dbo.Pays as p with (nolock) on p.PaysID = a.PaysID " +
                          "inner join dbo.Emplacement as e with (nolock) on e.EmplacementID = eb.EmplacementID " +
                          "inner join dbo.Clayette as cl with (nolock) on cl.ClayetteID = e.ClayetteID " +
                          " WHERE b.BouteilleNom = '" + args[0].entity + 
                          "' and b.AnneeMillesime = " + args[1].entity + 
                          " and c.Couleur = '" + args[2].entity + "'";

    console.log(ArraySQLRequest);

    connection.on('connect', function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Connected');
            console.log('Reading from db');
            console.log(ArraySQLRequest);

            request = new Request(ArraySQLRequest, function(err, rowCount, rows) {
                    console.log(rowCount + ' rows returned');
                    if (rowCount >= 1) {
                        for(var myKey in ResultsSQL) {
                            console.log("name:"+ResultsSQL[myKey].Bouteille+", Appellation:"+ResultsSQL[myKey].Appellation);
                        }
                        callback([rowCount, ResultsSQL]);
                    } else {
                        callback(null);
                    }
                }
            );

            request.on('row', function(columns) {
                var objRows = [];
                columns.forEach(function(column) {
    				objRows.push({ key:column.metadata.colName, value:column.value });
                });
    			ResultsSQL.push(objRows);
            });

            connection.execSql(request);
        }
    });

}


function insertnewBouteille(args, callback) {
   
    var connection = new Connection(config);
    var ArraySQLRequest;
    bouteilles = args[0];
    var temp = tempCreateBouteille.ExtractBouteille(bouteilles);
    var text = '';
    var cardbouteille = temp[0];

    ArraySQLRequest = "INSERT INTO dbo.Bouteille VALUES	" +
                      "((SELECT max(BouteilleID) FROM dbo.Bouteille) + 1, " +
                      "(SELECT AlcoolID FROM dbo.Alcool WHERE NomAlcool = 'Vin'), " +
                      "(SELECT AppellationID FROM dbo.Appellation WHERE Appellation = '" + cardbouteille.appellation + "'), " +
                      "(SELECT CouleurID FROM dbo.Couleur WHERE Couleur = '" + cardbouteille.couleur + "'), " +
                      "'" + cardbouteille.nom + "', " +
                      cardbouteille.millesime + ", " +
                      cardbouteille.maturation + ", " +
                      cardbouteille.expiration + ", "	+
                      "null, " +
                      "null, "

    if (cardbouteille.commentaires) {
        ArraySQLRequest += "'" + cardbouteille.commentaires + "', ";
    } else {
        ArraySQLRequest += "null, ";
    }

    ArraySQLRequest += "null, ";

    if (cardbouteille.codebarre) {
        ArraySQLRequest += cardbouteille.codebarre + ", ";
    } else {
        ArraySQLRequest += "null, ";
    }

    ArraySQLRequest += "getdate(), getdate(), null)";
           

    connection.on('connect', function(err) {
        if (err) {
            console.log(err);
        } else {
            
            console.log("Inserting a new ligne into database");
            console.log(ArraySQLRequest);

            request = new Request(ArraySQLRequest, function(err, rowCount, rows) {
                console.log(rowCount + ' row(s) inserted');
                if (rowCount >= 1) {
                    callback(rowCount);
                } else {
                    callback(null);
                }
            });

            connection.execSql(request);

        }
    });
}


exports.queryArraySQL = queryArraySQL;
exports.queryCouleurAppellationsbyMaturationSQL = queryCouleurAppellationsbyMaturationSQL;
exports.queryBouteilleFullDetailsSQL = queryBouteilleFullDetailsSQL;
exports.insertLigneSQL = insertLigneSQL;
exports.insertnewBouteille = insertnewBouteille;
