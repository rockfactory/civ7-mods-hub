use serde::{Deserialize, Deserializer};

fn deserialize_bool_from_option<'de, D: Deserializer<'de>>(
    deserializer: D,
) -> Result<bool, D::Error> {
    Option::<()>::deserialize(deserializer).map(|option| option.is_some())
}

fn deserialize_bool_from_int<'de, D: Deserializer<'de>>(deserializer: D) -> Result<bool, D::Error> {
    u8::deserialize(deserializer).map(|num| num > 0)
}

macro_rules! gen_deserialize_list {
    ($func_name:ident, $item_name:literal, $item:ident) => {
        fn $func_name<'de, D: ::serde::Deserializer<'de>>(
            deserializer: D,
        ) -> Result<Vec<$item>, D::Error> {
            type Item = $item;
            #[derive(::serde::Deserialize)]
            struct List {
                #[serde(rename = $item_name)]
                #[serde(default)]
                fields: ::std::vec::Vec<Item>,
            }
            Ok(List::deserialize(deserializer)?.fields)
        }
    };
}

gen_deserialize_list!(deserialize_dependencies, "Mod", DependenciesMod);
gen_deserialize_list!(deserialize_action_criteria, "Criteria", ActionCriteria);
gen_deserialize_list!(deserialize_action_groups, "ActionGroup", ActionGroup);

#[derive(Debug, Deserialize)]
pub struct Mod {
    #[serde(rename = "@id")]
    pub id: Option<String>,

    #[serde(rename = "@version")]
    pub version: Option<String>,

    #[serde(rename = "Properties")]
    pub properties: Option<ModProperties>,

    #[serde(rename = "Dependencies")]
    #[serde(deserialize_with = "deserialize_dependencies")]
    #[serde(default)]
    pub dependencies: Vec<DependenciesMod>,

    #[serde(rename = "ActionCriteria")]
    #[serde(deserialize_with = "deserialize_action_criteria")]
    #[serde(default)]
    pub action_criteria: Vec<ActionCriteria>,

    #[serde(rename = "ActionGroups")]
    #[serde(deserialize_with = "deserialize_action_groups")]
    #[serde(default)]
    pub action_groups: Vec<ActionGroup>,
}

#[derive(Debug, Deserialize)]
pub struct ModProperties {
    #[serde(rename = "Name")]
    pub name: Option<String>,

    #[serde(rename = "AffectsSavedGames")]
    #[serde(deserialize_with = "deserialize_bool_from_int")]
    #[serde(default)]
    pub affects_saved_games: bool,
}

#[derive(Debug, Deserialize)]
pub struct DependenciesMod {
    #[serde(rename = "@id")]
    pub id: String,
}

#[derive(Debug, Deserialize)]
pub struct ActionCriteria {
    #[serde(rename = "@id")]
    pub id: String,

    #[serde(rename = "AlwaysMet")]
    #[serde(deserialize_with = "deserialize_bool_from_option")]
    #[serde(default)]
    pub always_met: bool,
}

#[derive(Debug, Deserialize)]
pub struct ActionGroup {
    #[serde(rename = "@id")]
    pub id: String,

    #[serde(rename = "@scope")]
    pub scope: Option<String>,

    #[serde(rename = "@criteria")]
    pub criteria: Option<String>,

    #[serde(rename = "Properties")]
    pub properties: Vec<ActionGroupProperties>,
}

#[derive(Debug, Deserialize)]
pub struct ActionGroupProperties {
    #[serde(rename = "LoadOrder")]
    pub load_order: Option<i32>,
}
