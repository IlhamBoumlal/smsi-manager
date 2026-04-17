// Application/Sensibilisation/Queries/GetFormations/GetFormationsQuery.cs
using MediatR;
using backend.Application.DTOs;

namespace backend.Application.Sensibilisation.Queries.GetFormations;

public record GetFormationsQuery(Guid? SocieteId) : IRequest<List<FormationListDto>>;