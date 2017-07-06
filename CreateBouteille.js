function CreateBouteille(session, args) {
        
    var bouteille = [];
    bouteille.push({key:"Bouteille", value:session.privateConversationData.bouteille.nom.entity});
    bouteille.push({key:"Appellation", value:session.privateConversationData.bouteille.appellation.entity});
    bouteille.push({key:"Couleur", value:session.privateConversationData.bouteille.couleur.entity});
    bouteille.push({key:"Millesime", value:session.privateConversationData.bouteille.anneebouteille.entity});
    bouteille.push({key:"Maturation", value:session.privateConversationData.bouteille.anneematuration.entity});
    bouteille.push({key: "Expiration", value:session.privateConversationData.bouteille.anneeexpiration.entity});
    bouteille.push({key: "Pays", value:"France"});

    if (session.privateConversationData.bouteille.Autres == 'Oui') {
        bouteille.push({key: "Commentaires", value:session.privateConversationData.bouteille.commentaires.entity});
        bouteille.push({key: "CodeBarre", value:session.privateConversationData.bouteille.codebarre.entity});
    } else {
        bouteille.push({key: "Commentaires", value:null});
        bouteille.push({key: "CodeBarre", value:null});
    }

    return bouteille;
}


function ExtractBouteille(bouteilles) {
    
    var cardbouteille = {};
    var emplacementsbouteilles = {}; 
    var etagebouteilles = {};   
        
    for (var myKeyBouteilles in bouteilles) {
      bouteille = bouteilles[myKeyBouteilles];
      for (var myKey in bouteille) {
        switch (bouteille[myKey].key) {
          case 'Bouteille':
            cardbouteille.nom = bouteille[myKey].value;
            break;
          case 'Appellation':
            cardbouteille.appellation = bouteille[myKey].value;
            break;
          case 'Couleur':
            cardbouteille.couleur = bouteille[myKey].value;
            break;
          case 'Millesime':
            cardbouteille.millesime = bouteille[myKey].value;
            break;
          case 'Maturation':
            cardbouteille.maturation = bouteille[myKey].value;
            break;
          case 'Expiration':
            cardbouteille.expiration = bouteille[myKey].value;
            break;
          case 'Pays':
            cardbouteille.pays = bouteille[myKey].value;
            break;
          case 'Commentaires':
            cardbouteille.commentaires = bouteille[myKey].value;
            break;
          case 'CodeBarre':
            cardbouteille.codebarre = bouteille[myKey].value;
            break;
          case 'Num_Emplacement':
            emplacementsbouteilles[myKeyBouteilles] = bouteille[myKey].value;
            break;
          case 'Etage':
            etagebouteilles[myKeyBouteilles] = bouteille[myKey].value;
            break;
        }
      }
    }

    return ([cardbouteille, emplacementsbouteilles, etagebouteilles]);

}

exports.CreateBouteille = CreateBouteille;
exports.ExtractBouteille = ExtractBouteille;