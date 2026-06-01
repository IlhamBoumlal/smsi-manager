import {
  addClauseToProcessus,
  addDocument,
  createProcessus,
  deleteDocument,
  downloadFichier,
  getAllClausesForSelection,
  getAllControlesForSelection,
  removeControleFromProcessus,
  updateProcessus,
} from '../../../api/cartographie';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('api/cartographie', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('create et update processus envoient le body attendu', async () => {
    const body = { categorie: 'metier', nom: 'Gestion incidents', isoReferences: ['A.5'] };
    axiosInstance.post.mockResolvedValue({ data: { id: 'p1' } });
    axiosInstance.put.mockResolvedValue({ data: { id: 'p1' } });

    await createProcessus(body);
    await updateProcessus('p1', body);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/cartographie/processus', body);
    expect(axiosInstance.put).toHaveBeenCalledWith('/api/cartographie/processus/p1', body);
  });

  test('selection clauses utilise le fallback quand le nouveau endpoint est absent', async () => {
    axiosInstance.get
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({ data: [{ id: 4 }] });

    await expect(getAllClausesForSelection()).resolves.toEqual([{ id: 4 }]);

    expect(axiosInstance.get).toHaveBeenNthCalledWith(1, '/api/cartographie/clauses-selection');
    expect(axiosInstance.get).toHaveBeenNthCalledWith(2, '/api/cartographie/clauses');
  });

  test('selection controles propage les erreurs non 404', async () => {
    const error = { response: { status: 500 } };
    axiosInstance.get.mockRejectedValue(error);

    await expect(getAllControlesForSelection()).rejects.toBe(error);

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/cartographie/controles-selection');
  });

  test('liaisons clauses controles et documents appellent les routes attendues', async () => {
    axiosInstance.post.mockResolvedValue({ data: { ok: true } });
    axiosInstance.delete.mockResolvedValue({ data: undefined });

    await addClauseToProcessus('p1', { clauseId: 4, justification: 'SMSI' });
    await removeControleFromProcessus('p1', 12);
    await deleteDocument('p1', 'doc1');

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/cartographie/processus/p1/clauses', {
      clauseId: 4,
      justification: 'SMSI',
    });
    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/cartographie/processus/p1/controles/12');
    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/cartographie/processus/p1/documents/doc1');
  });

  test('addDocument construit un FormData avec fichier optionnel', async () => {
    const file = new File(['processus'], 'processus.pdf', { type: 'application/pdf' });
    axiosInstance.post.mockResolvedValue({ data: { id: 'doc1' } });

    await addDocument(
      'p1',
      { nom: 'Procedure', type: 'PDF', reference: 'DOC-1', statut: 'Valide' },
      file
    );

    const [url, formData] = axiosInstance.post.mock.calls[0];
    expect(url).toBe('/api/cartographie/processus/p1/documents');
    expect(formData.get('nom')).toBe('Procedure');
    expect(formData.get('type')).toBe('PDF');
    expect(formData.get('reference')).toBe('DOC-1');
    expect(formData.get('statut')).toBe('Valide');
    expect(formData.get('fichier')).toBe(file);
  });

  test('downloadFichier utilise le nom du content-disposition', async () => {
    const click = jest.fn();
    jest.spyOn(document, 'createElement').mockReturnValue({ click });
    window.URL.createObjectURL = jest.fn(() => 'blob:cartographie');
    window.URL.revokeObjectURL = jest.fn();
    axiosInstance.get.mockResolvedValue({
      data: new Blob(['contenu']),
      headers: { 'content-disposition': 'attachment; filename="cartographie.pdf"' },
    });

    await downloadFichier('doc1');

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/cartographie/documents/doc1/fichier', {
      responseType: 'blob',
    });
    expect(click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:cartographie');
  });
});
