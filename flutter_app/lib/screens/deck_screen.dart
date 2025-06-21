
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/deck_provider.dart';
import '../services/api_service.dart';
import '../models/card.dart';

class DeckScreen extends StatefulWidget {
  final int? deckId;

  const DeckScreen({super.key, this.deckId});

  @override
  State<DeckScreen> createState() => _DeckScreenState();
}

class _DeckScreenState extends State<DeckScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<MTGCard> _searchResults = [];
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    if (widget.deckId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.read<DeckProvider>().loadDeck(widget.deckId!);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Consumer<DeckProvider>(
          builder: (context, deckProvider, child) {
            return Text(deckProvider.currentDeck?.name ?? 'Deck');
          },
        ),
      ),
      body: Column(
        children: [
          // Card search section
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: 'Search for cards...',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: _searchCards,
                ),
              ),
              onSubmitted: (_) => _searchCards(),
            ),
          ),
          
          // Search results
          if (_isSearching)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: CircularProgressIndicator(),
            )
          else if (_searchResults.isNotEmpty)
            Expanded(
              child: ListView.builder(
                itemCount: _searchResults.length,
                itemBuilder: (context, index) {
                  final card = _searchResults[index];
                  return CardSearchResult(card: card);
                },
              ),
            )
          else
            // Deck contents
            Expanded(
              child: Consumer<DeckProvider>(
                builder: (context, deckProvider, child) {
                  final deck = deckProvider.currentDeck;
                  if (deck == null) {
                    return const Center(child: Text('No deck loaded'));
                  }

                  final cards = deck.cards ?? [];
                  if (cards.isEmpty) {
                    return const Center(
                      child: Text('No cards in deck. Search and add some!'),
                    );
                  }

                  return ListView.builder(
                    itemCount: cards.length,
                    itemBuilder: (context, index) {
                      final card = cards[index];
                      return ListTile(
                        title: Text(card['name'] ?? 'Unknown Card'),
                        subtitle: Text('Quantity: ${card['quantity'] ?? 1}'),
                        trailing: IconButton(
                          icon: const Icon(Icons.remove),
                          onPressed: () => _removeCardFromDeck(card),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _searchCards() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _isSearching = true;
    });

    try {
      final apiService = context.read<ApiService>();
      final results = await apiService.searchCards(query);
      setState(() {
        _searchResults = results;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Search failed: $e')),
      );
    } finally {
      setState(() {
        _isSearching = false;
      });
    }
  }

  void _addCardToDeck(MTGCard card) {
    final deckProvider = context.read<DeckProvider>();
    final currentDeck = deckProvider.currentDeck;
    
    if (currentDeck == null) return;

    final updatedCards = List<Map<String, dynamic>>.from(currentDeck.cards ?? []);
    
    // Check if card already exists
    final existingIndex = updatedCards.indexWhere((c) => c['id'] == card.id);
    if (existingIndex != -1) {
      updatedCards[existingIndex]['quantity'] = (updatedCards[existingIndex]['quantity'] ?? 1) + 1;
    } else {
      updatedCards.add({
        'id': card.id,
        'name': card.name,
        'quantity': 1,
        'set': card.set,
        'collector_number': card.collectorNumber,
      });
    }

    deckProvider.updateDeck(currentDeck.id!, {'cards': updatedCards});
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Added ${card.name} to deck')),
    );
  }

  void _removeCardFromDeck(Map<String, dynamic> card) {
    final deckProvider = context.read<DeckProvider>();
    final currentDeck = deckProvider.currentDeck;
    
    if (currentDeck == null) return;

    final updatedCards = List<Map<String, dynamic>>.from(currentDeck.cards ?? []);
    updatedCards.removeWhere((c) => c['id'] == card['id']);

    deckProvider.updateDeck(currentDeck.id!, {'cards': updatedCards});
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}

class CardSearchResult extends StatelessWidget {
  final MTGCard card;

  const CardSearchResult({super.key, required this.card});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8.0),
      child: ListTile(
        leading: card.imageUrl.isNotEmpty
            ? Image.network(
                card.imageUrl,
                width: 50,
                height: 70,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.image_not_supported),
              )
            : const Icon(Icons.image_not_supported),
        title: Text(card.name),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${card.setName} (${card.set.toUpperCase()})'),
            if (card.prices.usd != null) Text('Price: \$${card.prices.usd}'),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.add),
          onPressed: () => (context.findAncestorStateOfType<_DeckScreenState>())?._addCardToDeck(card),
        ),
      ),
    );
  }
}
