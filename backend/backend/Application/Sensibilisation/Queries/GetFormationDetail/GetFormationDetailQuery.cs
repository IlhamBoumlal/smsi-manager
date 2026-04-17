// Application/Sensibilisation/Queries/GetFormationDetail/GetFormationDetailQuery.cs
using MediatR;
using backend.Application.DTOs;

namespace backend.Application.Sensibilisation.Queries.GetFormationDetail;

public record GetFormationDetailQuery(Guid Id) : IRequest<FormationDetailDto?>;