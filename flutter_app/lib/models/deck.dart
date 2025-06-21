
import 'package:json_annotation/json_annotation.dart';

part 'deck.g.dart';

@JsonSerializable()
class Deck {
  final int? id;
  final String name;
  final String? description;
  final String format;
  final List<dynamic>? cards;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Deck({
    this.id,
    required this.name,
    this.description,
    required this.format,
    this.cards,
    this.createdAt,
    this.updatedAt,
  });

  factory Deck.fromJson(Map<String, dynamic> json) => _$DeckFromJson(json);
  Map<String, dynamic> toJson() => _$DeckToJson(this);
}
