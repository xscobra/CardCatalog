
import 'package:flutter/material.dart';
import '../models/deck.dart';
import '../services/api_service.dart';

class DeckProvider extends ChangeNotifier {
  final ApiService _apiService;
  
  List<Deck> _decks = [];
  Deck? _currentDeck;
  bool _isLoading = false;
  String? _error;

  DeckProvider(this._apiService);

  List<Deck> get decks => _decks;
  Deck? get currentDeck => _currentDeck;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadDecks() async {
    _setLoading(true);
    try {
      _decks = await _apiService.getDecks();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadDeck(int id) async {
    _setLoading(true);
    try {
      _currentDeck = await _apiService.getDeck(id);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> createDeck(String name, String format, {String? description}) async {
    _setLoading(true);
    try {
      final newDeck = await _apiService.createDeck({
        'name': name,
        'format': format,
        'description': description,
        'cards': [],
      });
      _decks.add(newDeck);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateDeck(int id, Map<String, dynamic> updates) async {
    _setLoading(true);
    try {
      final updatedDeck = await _apiService.updateDeck(id, updates);
      final index = _decks.indexWhere((deck) => deck.id == id);
      if (index != -1) {
        _decks[index] = updatedDeck;
      }
      if (_currentDeck?.id == id) {
        _currentDeck = updatedDeck;
      }
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> deleteDeck(int id) async {
    _setLoading(true);
    try {
      final success = await _apiService.deleteDeck(id);
      if (success) {
        _decks.removeWhere((deck) => deck.id == id);
        if (_currentDeck?.id == id) {
          _currentDeck = null;
        }
      }
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }
}
