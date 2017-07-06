var builder = require('botbuilder');
var tempCreateBouteille = require('./CreateBouteille');

function CreateLimitedCard(session, bouteille) {
    
    var card = new builder.HeroCard(session);
    var text = '';
    var temp = tempCreateBouteille.ExtractBouteille([bouteille]);
    var cardbouteille = temp[0];

    
    text = "";
    if (cardbouteille.nom) {
      text = cardbouteille.nom;
      if (cardbouteille.millesime) text += " " + cardbouteille.millesime;
      card.title(text);
    }

    if (cardbouteille.appellation) {
      text = cardbouteille.appellation;
      if (cardbouteille.couleur) text += " " + cardbouteille.couleur;
      card.subtitle(text);
    }
    
    text = "";
    if (cardbouteille.maturation) text += 'Année de Maturation: ' + cardbouteille.maturation;    
    card.text(text);
    
    card.images([builder.CardImage.create(session, "http://www.les-moulins-de-provence.fr/125-241-thickbox/vin-chateau-minuty.jpg")]);

    // card.tap(new builder.CardAction.openUrl(session, profile.html_url));

    text = "la bouteille " + cardbouteille.nom + " année " + cardbouteille.millesime + " " + cardbouteille.couleur;
    card.buttons([
      builder.CardAction.imBack(session, "Afficher toutes les infos de " + text, "Afficher Détails"),
      builder.CardAction.imBack(session, "Ranger " + text, "Ranger"),
      builder.CardAction.imBack(session, "Sortir " + text, "Sortir")
    ]);

    return card;
}


function CreateFullCard(session, args) {

    var card = new builder.HeroCard(session);

    bouteilles = args[1];
    temp = tempCreateBouteille.ExtractBouteille(bouteilles);
    var text = '';
    var cardbouteille = temp[0];
    var emplacementsbouteilles = temp[1]; 
    var etagebouteilles = temp[2];   
    cardbouteille.nombreencave = args[0];


    text = "";
    if (cardbouteille.nom) {
      text = cardbouteille.nom;
      if (cardbouteille.millesime) text += " " + cardbouteille.millesime;
      card.title(text);
    }

    if (cardbouteille.appellation) {
      text = cardbouteille.appellation;
      if (cardbouteille.couleur) text += " " + cardbouteille.couleur;
      card.subtitle(text);
    }
    
    text = "";
    if (cardbouteille.maturation) text += 'Année de Maturation: ' + cardbouteille.maturation;
    if (cardbouteille.expiration) text += "\r\nA boire avant fin de l'année: " + cardbouteille.expiration;
    if (cardbouteille.codebarre) text += "\r\nCode Barre: " + cardbouteille.codebarre;
    if (cardbouteille.commentaires) text += "\r\n Vos Commentaires:\r\n" + cardbouteille.commentaires;
    if (cardbouteille.nombreencave) text += '\r\nNombre en Cave: ' + cardbouteille.nombreencave;
    for (myKey in emplacementsbouteilles  ) {
      var numerotation = parseInt(myKey) + 1;
      text += "\nBouteille n° " + numerotation + " Etage : " + etagebouteilles[myKey] + " Emplacement " + emplacementsbouteilles[myKey];
    }
    card.text(text);
    
    card.images([builder.CardImage.create(session, "http://www.les-moulins-de-provence.fr/125-241-thickbox/vin-chateau-minuty.jpg")]);

    // card.tap(new builder.CardAction.openUrl(session, profile.html_url));

    text = "la bouteille " + cardbouteille.nom + " année " + cardbouteille.millesime + " " + cardbouteille.couleur;
    
    switch(args[2]) {
      case 'Old':
        card.buttons([
          builder.CardAction.imBack(session, "Ranger " + text, "Ranger"),
          builder.CardAction.imBack(session, "Sortir " + text, "Sortir")
        ]);
        break;
      case 'New':
        card.buttons([
          builder.CardAction.imBack(session, "Ranger " + text, "Ranger")
        ]);
        break;
    }

    return card;
}


exports.CreateLimitedCard = CreateLimitedCard;
exports.CreateFullCard = CreateFullCard;