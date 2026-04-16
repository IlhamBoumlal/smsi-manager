<<<<<<< HEAD
using backend.Domain.Enumerations;
=======
﻿using backend.Domain.Enumerations;
>>>>>>> meriem
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Domain.Entities
{
    public class Controle
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid(); //Guid: Génère un identifiant unique pour chaque contrôle

        [Required]
        [StringLength(10)]
        [Display(Name = "Code Annexe A")]
<<<<<<< HEAD
        public string Code { get; set; } = string.Empty; // ex: A.5.1

        [Required]
        [StringLength(255)]
        public string Titre { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;
=======
        public string Code { get; set; } // ex: A.5.1

        [Required]
        [StringLength(255)]
        public string Titre { get; set; }

        [Required]
        public string Description { get; set; }
>>>>>>> meriem

        [Required]
        public DomaineControle Domaine { get; set; }

        public bool Applicable { get; set; } = true;

<<<<<<< HEAD
        public string JustificationApplicabilite { get; set; } = string.Empty;
=======
        public string JustificationApplicabilite { get; set; }
>>>>>>> meriem

        [Required]
        public Statut Statut { get; set; } = Statut.NonEvalue;

<<<<<<< HEAD
        public string Preuves { get; set; } = string.Empty; // Chemin vers fichier ou description

        public string Responsable { get; set; } = string.Empty; // Nom ou ID de l'utilisateur

        public string ReferenceDocument { get; set; } = string.Empty;
=======
        public string Preuves { get; set; } // Chemin vers fichier ou description

        public string Responsable { get; set; } // Nom ou ID de l'utilisateur

        public string ReferenceDocument { get; set; }
>>>>>>> meriem

        [DataType(DataType.DateTime)]
        public DateTime DateMiseAJour { get; set; } = DateTime.Now;

        // Lien avec une Société pour app est multi-société
        public int? SocieteId { get; set; }
        [ForeignKey("SocieteId")]
<<<<<<< HEAD
        public virtual Societe? Societe { get; set; }
=======
        public virtual Societe Societe { get; set; }
>>>>>>> meriem
    }
}
