import {
  addItem,
  addSection,
  createCycle,
  deleteItem,
  getCycle,
  getCycles,
  renameSection,
  updateItem,
} from '../../../api/pdca';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('api/pdca', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getCycles appelle la route des cycles', async () => {
    axiosInstance.get.mockResolvedValue({ data: [{ id: 'cycle-1' }] });

    await expect(getCycles()).resolves.toEqual([{ id: 'cycle-1' }]);

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/pdca/cycles');
  });

  test('getCycle appelle la route detail', async () => {
    axiosInstance.get.mockResolvedValue({ data: { id: 'cycle-1' } });

    await expect(getCycle('cycle-1')).resolves.toEqual({ id: 'cycle-1' });

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/pdca/cycles/cycle-1');
  });

  test('createCycle envoie uniquement le nom', async () => {
    axiosInstance.post.mockResolvedValue({ data: { id: 'cycle-1' } });

    await expect(createCycle('Cycle SMSI')).resolves.toEqual({ id: 'cycle-1' });

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/pdca/cycles', { name: 'Cycle SMSI' });
  });

  test('sections CRUD utilisent les routes attendues', async () => {
    axiosInstance.post.mockResolvedValue({ data: { id: 'section-1' } });
    axiosInstance.put.mockResolvedValue({ data: undefined });

    await addSection({ phaseId: 'phase-1', title: 'Planification' });
    await renameSection('section-1', 'Nouveau titre');

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/pdca/sections', {
      phaseId: 'phase-1',
      title: 'Planification',
    });
    expect(axiosInstance.put).toHaveBeenCalledWith('/api/pdca/sections/section-1', {
      title: 'Nouveau titre',
    });
  });

  test('items CRUD utilisent les payloads attendus', async () => {
    axiosInstance.post.mockResolvedValue({ data: { id: 'item-1' } });
    axiosInstance.put.mockResolvedValue({ data: undefined });
    axiosInstance.delete.mockResolvedValue({ data: undefined });

    await addItem({ sectionId: 'section-1', text: 'Action a faire' });
    await updateItem('item-1', 'done');
    await deleteItem('item-1');

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/pdca/items', {
      sectionId: 'section-1',
      text: 'Action a faire',
    });
    expect(axiosInstance.put).toHaveBeenCalledWith('/api/pdca/items/item-1', {
      status: 'done',
      text: null,
    });
    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/pdca/items/item-1');
  });
});
