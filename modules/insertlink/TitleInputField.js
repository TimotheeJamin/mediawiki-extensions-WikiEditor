var TitleInputWidget = require( './TitleInputWidget.js' );
var TitleOptionWidget = require( './TitleOptionWidget.js' );

/**
 * A FieldLayout containing a custom TitleInputwidget and message-display system.
 *
 * @class
 * @extends OO.ui.FieldLayout
 * @mixes OO.EventEmitter
 * @constructor
 */
function TitleInputField() {
	// Mixin constructor
	OO.EventEmitter.call( this );

	var input = new TitleInputWidget();
	input.connect( this, {
		change: this.onChange,
		select: this.onSelect
	} );

	// The URL mode is set by the user via radio buttons, or automatically for link targets that look like URLs.
	this.urlModes = {
		internal: 'internal',
		external: 'external'
	};
	this.urlMode = this.urlModes.internal;
	// The 'manual' URL mode flag is set when the user changes the mode, and doesn't change again.
	this.urlModeManual = false;

	var config = {
		align: 'top',
		label: mw.msg( 'wikieditor-toolbar-tool-link-int-target' ),
		classes: [ 'ext-WikiEditor-InsertLink-TitleInputField' ]
	};
	TitleInputField.super.call( this, input, config );
}

OO.inheritClass( TitleInputField, OO.ui.FieldLayout );
OO.mixinClass( TitleInputField, OO.EventEmitter );

/**
 * Reset the field to initial state.
 */
TitleInputField.prototype.reset = function () {
	this.getField().setValue( '' );
	this.urlModeManual = false;
	this.urlMode = this.urlModes.internal;
};

/**
 * Set the URL mode and disable automatic detection of external URLs.
 *
 * @public
 * @param {string} urlMode One of the `TitleInputField.urlModes.*` values.
 */
TitleInputField.prototype.setUrlMode = function ( urlMode ) {
	this.urlMode = urlMode === this.urlModes.external ?
		this.urlModes.external :
		this.urlModes.internal;
	this.urlModeManual = true;
	this.getField().selectFirstMatch();
	this.validate( this.getField().getValue() );
};

/**
 * @public
 * @return {boolean}
 */
TitleInputField.prototype.isExternal = function () {
	return this.urlMode === this.urlModes.external;
};

/**
 * @inheritDoc
 */
TitleInputField.prototype.makeMessage = function ( kind, text ) {
	this.message = new OO.ui.MessageWidget( {
		type: kind,
		inline: true,
		label: text
	} );
	return this.message.$element;
};

/**
 * Set the displayed field message, replacing any that is already set.
 *
 * @param {string} icon
 * @param {string} message
 * @param {string} type
 */
TitleInputField.prototype.setMessage = function ( icon, message, type ) {
	this.setNotices( [ message ] );
	// Note that setNotices() must be called before this.message is available.
	this.message.setType( type || 'notice' );
	this.message.setIcon( icon );
};

/**
 * @private
 * @param {string} value
 */
TitleInputField.prototype.onChange = function ( value ) {
	if ( !this.urlModeManual && this.getField().looksLikeExternalLink( value ) ) {
		this.urlMode = this.urlModes.external;
	}
	this.validate( value );
};

/**
 * Set message and emit event.
 *
 * @private
 * @param {string} value
 */
TitleInputField.prototype.validate = function ( value ) {
	if ( this.urlMode === this.urlModes.internal && value !== '' && !mw.Title.newFromText( value ) ) {
		this.setMessage( 'error', mw.message( 'wikieditor-toolbar-tool-link-int-target-status-invalid' ).parse(), 'error' );
		this.emit( 'invalid' );
	} else {
		// Remove message; it'll be re-added if required (after selection or blur).
		this.setNotices( [] );
		this.emit( 'change', value );
	}
};

/**
 * @param {TitleOptionWidget} item
 */
TitleInputField.prototype.onSelect = function ( item ) {
	if ( this.urlMode === this.urlModes.external || ( !this.urlModeManual && this.urlMode === this.urlModes.internal && item.isExternal() ) ) {
		this.setMessage( 'linkExternal', mw.message( 'wikieditor-toolbar-tool-link-int-target-status-external' ).parse() );
	} else if ( item.isDisambiguation() ) {
		this.setMessage( 'articleDisambiguation', mw.message( 'wikieditor-toolbar-tool-link-int-target-status-disambig' ).parse() );
	} else if ( !item.isMissing() && !item.isExternal() ) {
		this.setMessage( 'article', mw.message( 'wikieditor-toolbar-tool-link-int-target-status-exists' ).parse() );
	} else {
		this.setMessage( 'articleNotFound', mw.message( 'wikieditor-toolbar-tool-link-int-target-status-notexists' ).parse() );
	}
};

module.exports = TitleInputField;
