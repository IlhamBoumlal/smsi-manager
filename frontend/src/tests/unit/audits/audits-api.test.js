import {
  createAudit,
  createNC,
  createSimulation,
  deleteAudit,
  deleteNC,
  deleteSimulation,
  getAllAudits,
  getAllNCs,
  getAllSimulations,
  updateAudit,
  updateNC,
} from '../../../api/audits';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('api/audits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('liste audits, non-conformites et simulations', async () => {
    axiosInstance.get
      .mockResolvedValueOnce({ data: [{ id: 1 }] })
      .mockResolvedValueOnce({ data: [{ id: 2 }] })
      .mockResolvedValueOnce({ data: [{ id: 3 }] });

    await getAllAudits();
    await getAllNCs();
    await getAllSimulations();

    expect(axiosInstance.get).toHaveBeenNthCalledWith(1, '/api/audits');
    expect(axiosInstance.get).toHaveBeenNthCalledWith(2, '/api/audits/ncs');
    expect(axiosInstance.get).toHaveBeenNthCalledWith(3, '/api/audits/simulations');
  });

  test('CRUD audit appelle les routes attendues', async () => {
    const body = { title: 'Audit interne', status: 'planifie' };
    axiosInstance.post.mockResolvedValue({ data: { id: 1 } });
    axiosInstance.put.mockResolvedValue({ data: { id: 1 } });
    axiosInstance.delete.mockResolvedValue({ data: undefined });

    await createAudit(body);
    await updateAudit(1, body);
    await deleteAudit(1);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/audits', body);
    expect(axiosInstance.put).toHaveBeenCalledWith('/api/audits/1', body);
    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/audits/1');
  });

  test('CRUD non-conformite appelle les routes attendues', async () => {
    const body = { title: 'NC majeure', controlId: 'A.5.1', status: 'ouverte' };
    axiosInstance.post.mockResolvedValue({ data: { id: 2 } });
    axiosInstance.put.mockResolvedValue({ data: { id: 2 } });
    axiosInstance.delete.mockResolvedValue({ data: undefined });

    await createNC(body);
    await updateNC(2, body);
    await deleteNC(2);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/audits/ncs', body);
    expect(axiosInstance.put).toHaveBeenCalledWith('/api/audits/ncs/2', body);
    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/audits/ncs/2');
  });

  test('simulation cree et supprime sur le bon endpoint', async () => {
    const body = { name: 'Simulation ISO', score: 80 };
    axiosInstance.post.mockResolvedValue({ data: { id: 3 } });
    axiosInstance.delete.mockResolvedValue({ data: undefined });

    await createSimulation(body);
    await deleteSimulation(3);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/audits/simulations', body);
    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/audits/simulations/3');
  });
});
