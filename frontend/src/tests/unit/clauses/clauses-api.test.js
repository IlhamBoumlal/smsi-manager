import {
  createActionPlan,
  deleteActionPlanFile,
  downloadFile,
  getDashboard,
  getGlobalStats,
  openFile,
  uploadConformityProofFile,
  upsertConformity,
} from '../../../api/clauses';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('api/clauses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('dashboard et stats appellent les bonnes routes', async () => {
    axiosInstance.get
      .mockResolvedValueOnce({ data: [{ clause: { id: 4 } }] })
      .mockResolvedValueOnce({ data: { totalClauses: 7 } });

    await expect(getDashboard()).resolves.toEqual([{ clause: { id: 4 } }]);
    await expect(getGlobalStats()).resolves.toEqual({ totalClauses: 7 });

    expect(axiosInstance.get).toHaveBeenNthCalledWith(1, '/api/clauses/dashboard');
    expect(axiosInstance.get).toHaveBeenNthCalledWith(2, '/api/clauses/stats');
  });

  test('upsertConformity fusionne subClauseId et donnees', async () => {
    axiosInstance.put.mockResolvedValue({ data: { status: 'conforme' } });

    await expect(upsertConformity(41, { status: 'conforme', score: 100 }))
      .resolves.toEqual({ status: 'conforme' });

    expect(axiosInstance.put).toHaveBeenCalledWith('/api/clauses/conformity', {
      subClauseId: 41,
      status: 'conforme',
      score: 100,
    });
  });

  test('createActionPlan poste le dto tel quel', async () => {
    const dto = { isoClauseId: 4, reference: 'PA-001' };
    axiosInstance.post.mockResolvedValue({ data: { id: 1 } });

    await expect(createActionPlan(dto)).resolves.toEqual({ id: 1 });

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/clauses/plans', dto);
  });

  test('uploadConformityProofFile envoie un FormData avec callback de progression', async () => {
    const progress = jest.fn();
    const file = new File(['preuve'], 'preuve.pdf', { type: 'application/pdf' });
    axiosInstance.post.mockResolvedValue({ data: { id: 9 } });

    await expect(uploadConformityProofFile(7, file, 'preuve valide', progress))
      .resolves.toEqual({ id: 9 });

    const [url, formData, config] = axiosInstance.post.mock.calls[0];
    expect(url).toBe('/api/clauses/proofs/7/files');
    expect(formData.get('file')).toBe(file);
    expect(formData.get('description')).toBe('preuve valide');

    config.onUploadProgress({ loaded: 50, total: 100 });
    expect(progress).toHaveBeenCalledWith(50);
  });

  test('deleteActionPlanFile appelle la route document plan', async () => {
    axiosInstance.delete.mockResolvedValue({ data: undefined });

    await deleteActionPlanFile(12);

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/clauses/plans/files/12');
  });

  test('downloadFile cree un lien temporaire de telechargement', async () => {
    const link = document.createElement('a');
    const click = jest.fn();
    link.click = click;
    const appendChild = jest.spyOn(document.body, 'appendChild');
    const removeChild = jest.spyOn(document.body, 'removeChild');
    jest.spyOn(document, 'createElement').mockReturnValue(link);
    window.URL.createObjectURL = jest.fn(() => 'blob:url');
    window.URL.revokeObjectURL = jest.fn();
    axiosInstance.get.mockResolvedValue({
      data: new Blob(['contenu']),
      headers: { 'content-type': 'application/pdf' },
    });

    await downloadFile(5, 'preuve.pdf');

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/clauses/files/5/download', {
      responseType: 'blob',
    });
    expect(click).toHaveBeenCalled();
    expect(appendChild).toHaveBeenCalled();
    expect(removeChild).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });

  test('openFile ouvre un onglet avec iframe', async () => {
    const openedTab = { document: { body: { innerHTML: '' } } };
    window.open = jest.fn(() => openedTab);
    window.URL.createObjectURL = jest.fn(() => 'blob:preview');
    window.URL.revokeObjectURL = jest.fn();
    axiosInstance.get.mockResolvedValue({
      data: new Blob(['contenu']),
      headers: { 'content-type': 'application/pdf' },
    });

    await openFile(5, 'preuve.pdf');

    expect(window.open).toHaveBeenCalled();
    expect(openedTab.document.body.innerHTML).toContain('blob:preview');
  });
});
