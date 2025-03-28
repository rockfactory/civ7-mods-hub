use serde::{Deserialize, Serialize};
use serde_with::{serde_as, skip_serializing_none};

serde_with::serde_conv!(
    MarkerTag,
    bool,
    |value: &bool| if *value { vec![()] } else { vec![] },
    |option: Vec<()>| -> Result<_, std::convert::Infallible> { Ok(!option.is_empty()) }
);

serde_with::serde_conv!(
    OneHotEncoding,
    bool,
    |value: &bool| if *value { 1 } else { 0 },
    |num: u8| -> Result<_, std::convert::Infallible> { Ok(num > 0) }
);

macro_rules! gen_list_parser {
    ($mod_name:ident, $item_name:literal, $item:ident) => {
        mod $mod_name {
            use super::*;

            type Item = $item;

            pub fn serialize<S: ::serde::Serializer>(
                items: &Vec<$item>,
                serializer: S,
            ) -> Result<S::Ok, S::Error> {
                #[derive(::serde::Serialize)]
                struct List<'a> {
                    #[serde(rename = $item_name)]
                    #[serde(default)]
                    items: &'a Vec<Item>,
                }
                [List { items }].serialize(serializer)
            }

            pub fn deserialize<'de, D: ::serde::Deserializer<'de>>(
                deserializer: D,
            ) -> Result<Vec<$item>, D::Error> {
                #[derive(::serde::Deserialize)]
                struct List {
                    #[serde(rename = $item_name)]
                    #[serde(default)]
                    items: Vec<Item>,
                }
                Ok(<Vec<List>>::deserialize(deserializer)?
                    .into_iter()
                    .map(|v| v.items)
                    .flatten()
                    .collect())
            }
        }
    };
}

const fn default_true() -> bool {
    true
}

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct Mod {
    #[serde(rename = "@id")]
    pub id: String,

    #[serde(rename = "@version")]
    pub version: Option<String>,

    #[serde(rename = "Properties")]
    #[serde(default)]
    pub properties: Properties,

    #[serde(rename = "Dependencies")]
    #[serde(with = "parse_dependencies")]
    #[serde(default)]
    pub dependencies: Vec<Dependency>,

    #[serde(rename = "LocalizedText")]
    #[serde(with = "parse_localized_text")]
    #[serde(default)]
    pub localized_text: Vec<String>,

    #[serde(rename = "ActionCriteria")]
    #[serde(with = "parse_action_criteria")]
    #[serde(default)]
    pub action_criteria: Vec<ActionCriterion>,

    #[serde(rename = "ActionGroups")]
    #[serde(with = "parse_action_groups")]
    #[serde(default)]
    pub action_groups: Vec<ActionGroup>,
}

gen_list_parser!(parse_dependencies, "Mod", Dependency);
gen_list_parser!(parse_localized_text, "File", String);
gen_list_parser!(parse_action_criteria, "Criteria", ActionCriterion);
gen_list_parser!(parse_action_groups, "ActionGroup", ActionGroup);

/// Some properties are defined at [https://github.com/thecrazyscotsman/TCS-Improved-Mod-Page?tab=readme-ov-file#custom-properties].
#[serde_as]
#[skip_serializing_none]
#[derive(Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Properties {
    #[serde(rename = "Name")]
    pub name: Option<String>,

    #[serde(rename = "Description")]
    pub description: Option<String>,

    #[serde(rename = "Authors")]
    pub authors: Option<String>,

    #[serde(rename = "Package")]
    pub package: Option<String>,

    #[serde(rename = "AffectsSavedGames")]
    #[serde_as(as = "OneHotEncoding")]
    #[serde(default = "default_true")]
    pub affects_saved_games: bool,

    #[serde(rename = "SpecialThanks")]
    pub special_thanks: Option<String>,

    #[serde(rename = "Version")]
    pub version: Option<String>,

    #[serde(rename = "Compatibility")]
    pub compatibility: Option<String>,

    #[serde(rename = "URL")]
    pub url: Option<String>,
}

#[skip_serializing_none]
#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct Dependency {
    #[serde(rename = "@id")]
    pub id: String,

    #[serde(rename = "@title")]
    pub title: Option<String>,
}

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct ActionCriterion {
    #[serde(rename = "@id")]
    pub id: String,

    #[serde(rename = "AlwaysMet")]
    #[serde_as(as = "MarkerTag")]
    #[serde(default)]
    pub always_met: bool,

    #[serde(rename = "AgeInUse")]
    pub age_in_use: Option<String>,

    #[serde(rename = "ModInUse")]
    pub mod_in_use: Option<ActionCriterionModInUse>,
}

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct ActionCriterionModInUse {
    #[serde(rename = "$value")]
    pub mod_id: String,

    #[serde(rename = "@inverse")]
    #[serde_as(as = "OneHotEncoding")]
    #[serde(default)]
    pub inverse: bool,
}

#[skip_serializing_none]
#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct ActionGroup {
    #[serde(rename = "@id")]
    pub id: String,

    #[serde(rename = "@scope")]
    pub scope: Option<String>,

    #[serde(rename = "@criteria")]
    pub criteria: Option<String>,

    #[serde(rename = "Properties")]
    #[serde(default)]
    pub properties: ActionGroupProperties,

    #[serde(rename = "Actions")]
    #[serde(default)]
    pub actions: Vec<ActionGroupActions>,
}

#[skip_serializing_none]
#[derive(Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct ActionGroupProperties {
    #[serde(rename = "LoadOrder")]
    pub load_order: Option<i32>,
}

#[skip_serializing_none]
#[derive(Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct ActionGroupActions {
    #[serde(rename = "ImportFiles")]
    #[serde(with = "parse_action_items")]
    #[serde(default)]
    pub import_files: Vec<ActionItem>,

    #[serde(rename = "UIScripts")]
    #[serde(with = "parse_action_items")]
    #[serde(default)]
    pub ui_scripts: Vec<ActionItem>,

    #[serde(rename = "UpdateDatabase")]
    #[serde(with = "parse_action_items")]
    #[serde(default)]
    pub update_database: Vec<ActionItem>,

    #[serde(rename = "UpdateText")]
    #[serde(with = "parse_action_items")]
    #[serde(default)]
    pub update_text: Vec<ActionItem>,
}

#[serde_as]
#[skip_serializing_none]
#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct ActionItem {
    #[serde(rename = "$value")]
    pub path: String,

    #[serde(rename = "@locale")]
    pub locale: Option<String>,
}

gen_list_parser!(parse_action_items, "Item", ActionItem);

#[cfg(test)]
mod tests {
    use super::*;
    use indoc::indoc;

    #[test]
    fn test_mod_properties() -> anyhow::Result<()> {
        let actual = quick_xml::de::from_str::<Properties>(indoc! {r#"
            <Properties>
                <Name>NAME</Name>
                <Description>DESCRIPTION</Description>
                <Authors>AUTHORS</Authors>
                <Package>PACKAGE</Package>
                <SpecialThanks>SPECIAL_THANKS</SpecialThanks>
                <Compatibility>COMPATIBILITY</Compatibility>
                <URL>URL</URL>
                <Version>VERSION</Version>
            </Properties>
        "#})?;

        let expected = Properties {
            name: Some("NAME".to_string()),
            description: Some("DESCRIPTION".to_string()),
            authors: Some("AUTHORS".to_string()),
            package: Some("PACKAGE".to_string()),
            affects_saved_games: true,
            special_thanks: Some("SPECIAL_THANKS".to_string()),
            version: Some("VERSION".to_string()),
            compatibility: Some("COMPATIBILITY".to_string()),
            url: Some("URL".to_string()),
        };

        assert_eq!(actual, expected);

        assert_eq!(
            quick_xml::de::from_str::<Properties>(indoc! {r#"
                <Properties>
                    <AffectsSavedGames>0</AffectsSavedGames>
                </Properties>
            "#})?,
            Properties {
                affects_saved_games: false,
                ..Default::default()
            },
        );

        assert_eq!(
            quick_xml::de::from_str::<Properties>(indoc! {r#"
                <Properties>
                    <AffectsSavedGames>1</AffectsSavedGames>
                </Properties>
            "#})?,
            Properties {
                affects_saved_games: true,
                ..Default::default()
            },
        );

        assert_eq!(
            quick_xml::de::from_str::<Properties>("<Properties></Properties>")?,
            Properties {
                affects_saved_games: true,
                ..Default::default()
            },
        );

        Ok(())
    }

    #[test]
    fn test_action_criteria() -> anyhow::Result<()> {
        let actual = quick_xml::de::from_str::<ActionCriterion>(indoc! {r#"
            <Criteria id="ID">
                <AlwaysMet/>
                <AgeInUse>AGE_ANTIQUITY</AgeInUse>
                <ModInUse inverse="1">MOD_ID</ModInUse>
            </Criteria>
        "#})?;

        let expected = ActionCriterion {
            id: "ID".to_string(),
            always_met: true,
            age_in_use: Some("AGE_ANTIQUITY".to_string()),
            mod_in_use: Some(ActionCriterionModInUse {
                mod_id: "MOD_ID".to_string(),
                inverse: true,
            }),
        };

        assert_eq!(actual, expected);

        Ok(())
    }

    #[test]
    fn test_action_groups() -> anyhow::Result<()> {
        let actual = quick_xml::de::from_str::<ActionGroup>(indoc! {r#"
            <ActionGroup id="ID" scope="SCOPE" criteria="CRITERIA">
    			<Properties>
    				<LoadOrder>4</LoadOrder>
    			</Properties>
    			<Actions>
    				<UpdateDatabase>
    					<Item>A.sql</Item>
    					<Item>B.sql</Item>
    					<Item locale="de_DE">C.sql</Item>
    				</UpdateDatabase>
    			</Actions>
    		</ActionGroup>
		"#})?;

        let expected = ActionGroup {
            id: "ID".to_string(),
            scope: Some("SCOPE".to_string()),
            criteria: Some("CRITERIA".to_string()),
            properties: ActionGroupProperties {
                load_order: Some(4),
            },
            actions: vec![ActionGroupActions {
                update_database: vec![
                    ActionItem {
                        path: "A.sql".to_string(),
                        locale: None,
                    },
                    ActionItem {
                        path: "B.sql".to_string(),
                        locale: None,
                    },
                    ActionItem {
                        path: "C.sql".to_string(),
                        locale: Some("de_DE".to_string()),
                    },
                ],
                ..Default::default()
            }],
        };

        assert_eq!(actual, expected);

        Ok(())
    }
}
