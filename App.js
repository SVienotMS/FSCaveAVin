var restify = require('restify');
var builder = require('botbuilder');
var querySQL = require('./SQL');
var scards = require('./SCards');
var exportcreatebouteille = require('./CreateBouteille');


// Setup Restify Server

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());

var LUISmodel = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/baa10071-cda0-4e82-9ba4-70010fe5fb47?subscription-key=71cbc00f25bd408caec9e46d838541dc&timezoneOffset=0&verbose=true&q='
var recognizer = new builder.LuisRecognizer(LUISmodel);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

bot.dialog('/', intents);

intents.matches('Bonjour' ,[
  function (session, args, next) {
    if (!session.dialogData.profile) session.dialogData.profile = session.privateConversationData.profile || {};
    if (!session.dialogData.profile.name) {
      builder.Prompts.text(session, 'Bonjour, qui es-tu?');
    } else {
      next();
    }
  },
  function (session, results, next) {
    if (results.response) {
            session.dialogData.profile.name = results.response;
    }
    session.send('Bonjour ' +  session.dialogData.profile.name);
  }
]);


intents.matches('AjoutBouteille', [
  function (session, args, next) {
    session.beginDialog('/CreationBouteille', args);
  }
]);


intents.matches('AfficherContenu', [
  function (session, args, next) {
    session.beginDialog('/AfficherContenu', args);
  }
]);


intents.matches('ConseilBouteille', [
  function (session, args, next) {
    session.beginDialog('/ConseilBouteille', args);
  }
]);


intents.matches('AfficherCouleursDisponibles', [
  function (session, args, next) {
    session.beginDialog('/AfficherCouleursDisponibles', args);
  }
]);


intents.matches('AfficheBouteille', [
  function (session, args, next) {
    session.beginDialog('/AfficheBouteille', args)
  }
]);


intents.matches('SortirBouteille', [
  function (session, args, next) {
    session.beginDialog('/SortirBouteille', args)
  }
]);


intents.matches('RangerBouteille', [
  function (session, args, next) {
    session.beginDialog('/RangerBouteille', args)
  }
]);

intents.onDefault([
  function (session, args, next) {
    var choix = ['Ranger une bouteille', 'Avoir un conseil'];

    builder.Prompts.choice(session, "Je n'ai pas compris, que souhaitez-vous faire?", choix, {listStyle: builder.ListStyle.button} );
  },
  function (session, results, next) {
    switch(results.response.entity) {
      case 'Avoir un conseil' :
      session.beginDialog('/ConseilBouteille', null);
      break;
    }
  }
]);


bot.dialog ('/AfficherCouleursDisponibles', [
  function (session, args, next) {
    session.send('Vous souhaitez afficher les couleurs de vin disponibles');

    querySQL.queryArraySQL(['AfficherCouleursDisponibles'], function (couleurs) {
      builder.Prompts.choice(session, 'Liste des couleurs:', couleurs, {listStyle: builder.ListStyle.button} );
    });
  }, function (session, result, next) {
    session.send('Votre choix: ' + result.response.entity);

    session.endDialog();
  }
]);


bot.dialog ('/CreationBouteille', [
  function (session, args, next) {
    session.send('Vous souhaitez créer une nouvelle bouteille');

    session.privateConversationData.bouteille = {};

    builder.Prompts.text(session, 'Quel est le nom de la bouteille?');
  }, function (session, results, next) {
    session.privateConversationData.bouteille.nom = {};

    session.privateConversationData.bouteille.nom.entity = results.response;
        
    querySQL.queryArraySQL(['AfficherCouleurs'], function (couleurs) {
      couleurs.push('Autre');
      builder.Prompts.choice(session, 'Choisissez la couleur du vin', couleurs, {listStyle: builder.ListStyle.button} );
    });
  }, function (session, result, next) {
     session.privateConversationData.bouteille.couleur = {};

    session.privateConversationData.bouteille.couleur.entity = result.response.entity;
    
    if (result.response.entity == 'Autre') {
      builder.Prompts.text(session, 'Quelle est la couleur du vin?');
    } else next();
  }, function (session, results, next) {
    if (session.privateConversationData.bouteille.couleur.entity == 'Autre') {
      session.privateConversationData.bouteille.couleur.entity = results.response;
      querySQL.insertLigneSQL(['InsertCouleur', session.privateConversationData.bouteille.couleur.entity], function (rowCount) {
        session.send("Fonction insert couleur, " + rowCount + " ligne ajoutée.");
        next();
      });
    } else next();
  }, function (session, results, next) {
      builder.Prompts.number(session, "Quelle est l'année de mise en bouteille?");
  }, function (session, results, next) {

      session.privateConversationData.bouteille.anneebouteille = {};
      session.privateConversationData.bouteille.anneebouteille.entity = results.response;

      querySQL.queryArraySQL(['BouteilleExistante', session.privateConversationData.bouteille.nom.entity, 
                              session.privateConversationData.bouteille.couleur.entity, 
                              session.privateConversationData.bouteille.anneebouteille.entity], function (rowCount) {
                                if (rowCount != null) {
                                  session.endDialog("Cette bouteille existe déjà");
                                } else next();
                              });
  }, function (session, results, next) {

      builder.Prompts.number(session, "Quelle est l'année de maturation de cette bouteille?");

  }, function (session, results, next) {

      session.privateConversationData.bouteille.anneematuration = {};
      session.privateConversationData.bouteille.anneematuration.entity = results.response;

      builder.Prompts.number(session, "Avant quelle année faut-il boire cette bouteille?");

  }, function (session, results, next) {

      session.privateConversationData.bouteille.anneeexpiration = {};
      session.privateConversationData.bouteille.anneeexpiration.entity = results.response;

      builder.Prompts.text(session, "Quelle est la 1ère lettre de l'appellation?");
  }, function (session, results, next) {

      session.privateConversationData.bouteille.appellation = {};
      if(results.response.length == 1) {
        querySQL.queryArraySQL(['AfficherAppellation1stLetter', results.response], function (appellationslist) {
            if (appellationslist != null) {
              appellationslist.push('Autre');
              builder.Prompts.choice(session, "Quelle est l'appellation du vin?", appellationslist, {listStyle: builder.ListStyle.button} );
            } else {
              session.send("Je ne trouve pas d'appellation existante équivalente");
              session.privateConversationData.bouteille.appellation.entity = 'Inconnue';
              next();
            }
        });
      }
  }, function (session, results, next) {

      if (results.response) {
        if (results.response.entity == 'Autre') {
          session.privateConversationData.bouteille.appellation.entity = 'Inconnue';
          builder.Prompts.text(session, "Comment s'appelle cette nouvelle Appellation?");
        } else {
          session.privateConversationData.bouteille.appellation.entity = results.response.entity;
          next();
        }
      } else builder.Prompts.text(session, "Comment s'appelle cette nouvelle Appellation?");
      
  }, function (session, results, next) {

      if (session.privateConversationData.bouteille.appellation.entity == 'Inconnue') {
        session.privateConversationData.bouteille.appellation.entity = results.response;
        querySQL.insertLigneSQL(['InsertAppellation', session.privateConversationData.bouteille.appellation.entity], function (rowCount) {
          next();
        });
    } else next();
  }, function (session, results, next) {

      builder.Prompts.choice(session, "Voulez-vous entrer d'autres informations?", ['Oui', 'Non'], {listStyle: builder.ListStyle.button});
  }, function (session, results, next) {
    
      session.privateConversationData.bouteille.Autres = results.response.entity;
      
      if (session.privateConversationData.bouteille.Autres == 'Oui') {
        builder.Prompts.number(session, "Quel est son code barre?");
      } else next();
  }, function (session, results, next) {
    
      if (session.privateConversationData.bouteille.Autres == 'Oui') {
        session.privateConversationData.bouteille.codebarre = {};
        session.privateConversationData.bouteille.codebarre.entity = results.response;
        builder.Prompts.text(session, "Que souhaitez vous indiquer en commentaire?");
      } else next();
  }, function (session, results, next) {
      
      if (session.privateConversationData.bouteille.Autres == 'Oui') {
        session.privateConversationData.bouteille.commentaires = {};
        session.privateConversationData.bouteille.commentaires.entity = results.response;
      }

      session.privateConversationData.bouteillecreee = exportcreatebouteille.CreateBouteille(session);
      var cards = [];
      cards.push(scards.CreateFullCard(session, [0, [session.privateConversationData.bouteillecreee], 'Empty']));
      var message = new builder.Message(session).attachments(cards).attachmentLayout('carousel');
      session.send("Voici un résumé des informations sur la bouteille");
      session.send(message);
      builder.Prompts.choice(session, "Confirmez-vous la création de cette bouteille?", ["Oui","Non"], {listStyle: builder.ListStyle.button});
  }, function (session, results, next) {     

      if(results.response.entity == 'Oui') {
        querySQL.insertnewBouteille([[session.privateConversationData.bouteillecreee]], function (rowCount) {
          if (rowCount > 0) {
            session.send("Bouteille créée");
            var cards = [];
            cards.push(scards.CreateFullCard(session, [0, [session.privateConversationData.bouteillecreee], 'New']));
            var message = new builder.Message(session).attachments(cards).attachmentLayout('carousel');
            session.send(message);
          } else {
            session.send("La bouteille n'a pas pu être créée");
          }
        });
      } else {
        session.send("Annulation de la création");
      }      
      session.endDialog();
  }
]);


bot.dialog ('/AfficherContenu', [
    function (session, args, next) {
      var etagecaveluis = builder.EntityRecognizer.findEntity(args.entities, 'EtageCave');

      session.privateConversationData.etagecave = null;
  
      if (etagecaveluis) {
        session.privateConversationData.etagecave = etagecaveluis.entity;
        next();
      } else
      {
        session.send('Vous souhaitez afficher le contenu de la cave, mais je ne sais pas quel étage');
        builder.Prompts.text(session, 'Quel étage?');
      }
    },
    function (session, results, next) {
      if (results.response)
      {
        session.privateConversationData.etagecave = results.response;
      }
      
      session.send("Vous souhaitez afficher le contenu de l'etage " + session.privateConversationData.etagecave);

      session.endDialog();
    }
]);


/////////////////////////////////////////////////////////
//
//      Conseil Bouteille
//
/////////////////////////////////////////////////////////

bot.dialog ('/ConseilBouteille', [
  function (session, args, next) {
    session.privateConversationData.bouteille = {};
    
    if (args) {
       session.privateConversationData.bouteille.couleurvin = builder.EntityRecognizer.findEntity(args.entities, 'CouleurVin');
       session.privateConversationData.bouteille.regionvin = builder.EntityRecognizer.findEntity(args.entities, 'RegionVin');
    } else {
      session.privateConversationData.bouteille.couleurvin = null;
    }

// Recherche Couleur

    if (!session.privateConversationData.bouteille.couleurvin) {
      querySQL.queryArraySQL(['AfficherCouleursDisponibles', null, null], function (couleurs) {
        if (couleurs != null) {
          builder.Prompts.choice(session, 'Quelle couleur de vin cherchez-vous?', couleurs, {listStyle: builder.ListStyle.button} );
        } else {
          session.send("Désolé, la cave à vin est vide");
          session.endDialog();
        }
      });
    } else next();
  },
  function (session, results, next) {
    if (results.response) {
      session.privateConversationData.bouteille.couleurvin = {};
      session.privateConversationData.bouteille.couleurvin.entity = results.response.entity; 
    }

// Recherche Appellation

    if (!session.privateConversationData.bouteille.regionvin) {
      querySQL.queryArraySQL(['AfficherAppellationsDisponibles', session.privateConversationData.bouteille.couleurvin.entity, null], function (Appellations) {
        if (Appellations != null) {
          builder.Prompts.choice(session, 'Quelle appellation de vin cherchez vous?', Appellations, {listStyle: builder.ListStyle.button} );
        } else {
          session.send("Il n'existe pas de bouteille de ce type en cave");
          session.endDialog();
        }
      });
    } else next();
  },
  function (session, results) {
    if (results.response) {
      session.privateConversationData.bouteille.regionvin = {};
      session.privateConversationData.bouteille.regionvin.entity = results.response.entity; 
    }
    session.send("Vous cherchez une bouteille de vin de couleur " + session.privateConversationData.bouteille.couleurvin.entity + 
      ", et provenant de la région de " + session.privateConversationData.bouteille.regionvin.entity);

    querySQL.queryCouleurAppellationsbyMaturationSQL([session.privateConversationData.bouteille.couleurvin.entity, session.privateConversationData.bouteille.regionvin.entity], function(Bouteilles) {
      var cards = [];
      for(var myKey in Bouteilles) {
        cards[myKey] = scards.CreateLimitedCard(session, Bouteilles[myKey]);
      }
      var message = new builder.Message(session).attachments(cards).attachmentLayout('carousel');
      session.send(message);
    });

    session.endDialog();
  }
]);


bot.dialog('/AfficheBouteille', [
  function (session, args, next) {
    session.send("Afficher les détails d'une bouteille");

    session.privateConversationData.bouteille = {};
    
    if (args) {
       session.privateConversationData.bouteille.nom = builder.EntityRecognizer.findEntity(args.entities, 'NomBouteille');
       session.privateConversationData.bouteille.millesime = builder.EntityRecognizer.findEntity(args.entities, 'AnneeMillesime');
       session.privateConversationData.bouteille.couleurvin = builder.EntityRecognizer.findEntity(args.entities, 'CouleurVin');
    }
    next();
  },
    function (session, results, next) {
    if(!session.privateConversationData.bouteille.couleurvin) {
      querySQL.queryArraySQL(['AfficherCouleurs'], function (couleurs) {
        builder.Prompts.choice(session, 'Quelle est la couleur de la bouteille cherchée?', couleurs, {listStyle: builder.ListStyle.button} );
      });
    } else next();
  },
  function (session, results, next) {
    if (results.response) {
      session.privateConversationData.bouteille.couleurvin = {};
      session.privateConversationData.bouteille.couleurvin.entity = results.response.entity; 
    }
    if(!session.privateConversationData.bouteille.millesime) {
      builder.Prompts.number(session, "Quelle est l'année de la bouteille recherchée?");
    } else next();
  },
  function (session, results, next) {
    if(results.response) {
      session.privateConversationData.bouteille.millesime = {};
      session.privateConversationData.bouteille.millesime.entity = results.response; 
    }
    if(!session.privateConversationData.bouteille.nom) {
      builder.Prompts.text(session, "Quel est le nom de la bouteille recherchée?");
    } else next();
  },
  function (session, results, next) {

    if (results.response) {
      session.privateConversationData.bouteille.nom = {};
      session.privateConversationData.bouteille.nom.entity = results.response; 
    }
    
    session.send("Afficher les détails du " + session.privateConversationData.bouteille.nom.entity + 
        " " + session.privateConversationData.bouteille.millesime.entity + " " + session.privateConversationData.bouteille.couleurvin.entity);

    querySQL.queryBouteilleFullDetailsSQL( [session.privateConversationData.bouteille.nom, session.privateConversationData.bouteille.millesime, session.privateConversationData.bouteille.couleurvin], function (results) {
      if (results) {
         var cards = [];
         results.push('Old');
         cards[0] = scards.CreateFullCard(session, results);
         var message = new builder.Message(session).attachments(cards).attachmentLayout('carousel');
         session.send(message);
       } else {
         session.send("Il n'existe pas de bouteille de ce type.");
       }
    });
    session.endDialog();
  }
]);


bot.dialog('/SortirBouteille', [
  function (session, args, next) {
    session.send("Sortie d'une bouteille");

    session.privateConversationData.bouteille = {};
    
    if (args) {
       session.privateConversationData.bouteille.nom = builder.EntityRecognizer.findEntity(args.entities, 'NomBouteille');
       session.privateConversationData.bouteille.millesime = builder.EntityRecognizer.findEntity(args.entities, 'AnneeMillesime');
       session.privateConversationData.bouteille.couleurvin = builder.EntityRecognizer.findEntity(args.entities, 'CouleurVin');
    }
    next();
  },
    function (session, results, next) {
    if(!session.privateConversationData.bouteille.couleurvin) {
      querySQL.queryArraySQL(['AfficherCouleursDisponibles'], function (couleurs) {
        builder.Prompts.choice(session, 'Quelle est la couleur de la bouteille cherchée?', couleurs, {listStyle: builder.ListStyle.button} );
      });
    } else next();
  },
  function (session, results, next) {
    if (results.response) {
      session.privateConversationData.bouteille.couleurvin = {};
      session.privateConversationData.bouteille.couleurvin.entity = results.response.entity; 
    }
    if(!session.privateConversationData.bouteille.millesime) {
      builder.Prompts.number(session, "Quelle est l'année de la bouteille recherchée?");
    } else next();
  },
  function (session, results, next) {
    if(results.response) {
      session.privateConversationData.bouteille.millesime = {};
      session.privateConversationData.bouteille.millesime.entity = results.response; 
    }
    if(!session.privateConversationData.bouteille.nom) {
      builder.Prompts.text(session, "Quel est le nom de la bouteille recherchée?");
    } else next();
  },
  function (session, results, next) {

    if (results.response) {
      session.privateConversationData.bouteille.nom = {};
      session.privateConversationData.bouteille.nom.entity = results.response; 
    }
    
    session.send("Sortir le " + session.privateConversationData.bouteille.nom.entity + 
        " " + session.privateConversationData.bouteille.millesime.entity + " " + session.privateConversationData.bouteille.couleurvin.entity);

    querySQL.queryBouteilleFullDetailsSQL( [session.privateConversationData.bouteille.nom, session.privateConversationData.bouteille.millesime, session.privateConversationData.bouteille.couleurvin], function (results) {
      if (results) {
         var cards = [];
         results.push('Old');
         cards[0] = scards.CreateFullCard(session, results);
         var message = new builder.Message(session).attachments(cards).attachmentLayout('carousel');
         session.send(message);
       } else {
         session.send("Il n'existe pas de bouteille de ce type.");
       }
    });
    session.endDialog();
  }
]);


bot.dialog('/RangerBouteille', [
  function (session, args, next) {
    session.send("Rangement d'une bouteille");

    session.privateConversationData.bouteille = {};
    
    if (args) {
       session.privateConversationData.bouteille.nom = builder.EntityRecognizer.findEntity(args.entities, 'NomBouteille');
       session.privateConversationData.bouteille.millesime = builder.EntityRecognizer.findEntity(args.entities, 'AnneeMillesime');
       session.privateConversationData.bouteille.couleurvin = builder.EntityRecognizer.findEntity(args.entities, 'CouleurVin');
    }
    next();
  },
    function (session, results, next) {
    if(!session.privateConversationData.bouteille.couleurvin) {
      querySQL.queryArraySQL(['AfficherCouleursDisponibles'], function (couleurs) {
        builder.Prompts.choice(session, 'Quelle est la couleur de la bouteille cherchée?', couleurs, {listStyle: builder.ListStyle.button} );
      });
    } else next();
  },
  function (session, results, next) {
    if (results.response) {
      session.privateConversationData.bouteille.couleurvin = {};
      session.privateConversationData.bouteille.couleurvin.entity = results.response.entity; 
    }
    if(!session.privateConversationData.bouteille.millesime) {
      builder.Prompts.number(session, "Quelle est l'année de la bouteille recherchée?");
    } else next();
  },
  function (session, results, next) {
    if(results.response) {
      session.privateConversationData.bouteille.millesime = {};
      session.privateConversationData.bouteille.millesime.entity = results.response; 
    }
    if(!session.privateConversationData.bouteille.nom) {
      builder.Prompts.text(session, "Quel est le nom de la bouteille recherchée?");
    } else next();
  },
  function (session, results, next) {

    if (results.response) {
      session.privateConversationData.bouteille.nom = {};
      session.privateConversationData.bouteille.nom.entity = results.response; 
    }
    
    session.send("Ranger le " + session.privateConversationData.bouteille.nom.entity + 
        " " + session.privateConversationData.bouteille.millesime.entity + " " + session.privateConversationData.bouteille.couleurvin.entity);

    querySQL.queryArraySQL(['RechercheBouteilleID', session.privateConversationData.bouteille.nom.entity, session.privateConversationData.bouteille.millesime.entity, session.privateConversationData.bouteille.couleurvin.entity], function (BouteilleID) {
      session.privateConversationData.bouteille.bouteilleid = {};
      if (BouteilleID != null) {
        session.privateConversationData.bouteille.bouteilleid.entity = BouteilleID[0];
        next();
      } else {
        session.privateConversationData.bouteille.bouteilleid.entity = 0;
        session.send('Bouteille introuvable dans la base de donnée.');
        session.endDialog();
      }
    });
  }, function (session, results, next) {

    session.privateConversationData.emplacement = {};
      
    querySQL.queryArraySQL(['RechercheEmplacementLibre', 1], function (emplacements) {
      console.log("Recherche Emplacement");
      if (emplacements != null) {
        session.privateConversationData.emplacement.numplace = emplacements[0];
        session.privateConversationData.emplacement.etage = emplacements[1];
        session.privateConversationData.emplacement.emplacementID = emplacements[2];
        builder.Prompts.choice(session, "Il faut la ranger à l'étage " + session.privateConversationData.emplacement.etage +
                                        " et la place n° " + session.privateConversationData.emplacement.numplace +
                                        ". Confirmez-vous la ranger à cette place?", ["Oui", "Non"], {listStyle: builder.ListStyle.button});
      } else next();
    });
  }, function (session, results, next) {

    if (session.privateConversationData.emplacement.numplace) {
      if (results.response.entity == 'Oui') {
        querySQL.insertLigneSQL(['InsertEmplacementBouteille', session.privateConversationData.bouteille.bouteilleid.entity, session.privateConversationData.emplacement.emplacementID], function (RowCount) {
          if (RowCount > 0) {
            session.send("Bouteille rangée");

            querySQL.queryBouteilleFullDetailsSQL( [session.privateConversationData.bouteille.nom, session.privateConversationData.bouteille.millesime, session.privateConversationData.bouteille.couleurvin], function (results) {
              if (results) {
              var cards = [];
              results.push('Old');
              cards[0] = scards.CreateFullCard(session, results);
              var message = new builder.Message(session).attachments(cards).attachmentLayout('carousel');
              session.send(message);
             } else {
              session.send("Il n'existe pas de bouteille de ce type.");
              }
             });
          } else session.send("Echec de rangement");
        });
              
      } else {
        session.send("Bouteille non rangée");
      }
    } else {
      session.send("Il n'y a pas eu d'emplacement disponible trouvé");
    }   
    
    session.endDialog();
  }
]);


