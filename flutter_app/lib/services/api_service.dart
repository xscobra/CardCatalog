
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/deck.dart';
import '../models/card.dart';

class ApiService {
  // Use the same backend server that's already running
  static const String baseUrl = 'http://0.0.0.0:5000/api';
  
  final http.Client _client = http.Client();

  // Deck operations
  Future<List<Deck>> getDecks() async {
    final response = await _client.get(Uri.parse('$baseUrl/decks'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Deck.fromJson(json)).toList();
    }
    throw Exception('Failed to load decks');
  }

  Future<Deck> getDeck(int id) async {
    final response = await _client.get(Uri.parse('$baseUrl/decks/$id'));
    if (response.statusCode == 200) {
      return Deck.fromJson(json.decode(response.body));
    }
    throw Exception('Failed to load deck');
  }

  Future<Deck> createDeck(Map<String, dynamic> deckData) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/decks'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(deckData),
    );
    if (response.statusCode == 200) {
      return Deck.fromJson(json.decode(response.body));
    }
    throw Exception('Failed to create deck');
  }

  Future<Deck> updateDeck(int id, Map<String, dynamic> deckData) async {
    final response = await _client.patch(
      Uri.parse('$baseUrl/decks/$id'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(deckData),
    );
    if (response.statusCode == 200) {
      return Deck.fromJson(json.decode(response.body));
    }
    throw Exception('Failed to update deck');
  }

  Future<bool> deleteDeck(int id) async {
    final response = await _client.delete(Uri.parse('$baseUrl/decks/$id'));
    return response.statusCode == 200;
  }

  // Card search (using Scryfall API)
  Future<List<MTGCard>> searchCards(String query) async {
    if (query.trim().isEmpty) return [];
    
    final encodedQuery = Uri.encodeComponent(query.trim());
    final response = await _client.get(
      Uri.parse('https://api.scryfall.com/cards/search?q=$encodedQuery&order=name'),
      headers: {'User-Agent': 'MTG-Deck-Builder-Flutter/1.0'},
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> cards = data['data'] ?? [];
      return cards.map((json) => MTGCard.fromJson(json)).toList();
    } else if (response.statusCode == 404) {
      return [];
    }
    throw Exception('Failed to search cards');
  }

  // Deck import
  Future<Map<String, dynamic>> importDeck(String url) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/import/deck'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'url': url}),
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to import deck');
  }

  // Wishlist operations
  Future<List<dynamic>> getWishlistCards() async {
    final response = await _client.get(Uri.parse('$baseUrl/wishlist'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load wishlist');
  }

  Future<List<dynamic>> updateWishlistCards(List<dynamic> cards) async {
    final response = await _client.put(
      Uri.parse('$baseUrl/wishlist'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(cards),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to update wishlist');
  }

  void dispose() {
    _client.close();
  }
}
